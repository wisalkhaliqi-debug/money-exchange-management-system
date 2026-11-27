"""Flask API for the Smart Currency Exchange system.

Run from the repository root with: python -m backend.app
The API reuses the existing Oracle connection helper in database/connection.py.
"""
from pathlib import Path
import sys

from flask import Flask, jsonify, request, send_from_directory
import oracledb

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database.connection import get_connection  # noqa: E402

app = Flask(__name__, static_folder=None)


def query_rows(sql, params=None):
    """Run a read-only query and return rows as dictionaries."""
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, params or {})
            columns = [item[0].lower() for item in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    finally:
        connection.close()


@app.get("/")
def home():
    return send_from_directory(ROOT, "index.html")


@app.get("/<path:filename>")
def frontend_files(filename):
    # Serve the existing frontend assets from the repository root.
    if filename in {"index.html", "style.css", "script.js"}:
        return send_from_directory(ROOT, filename)
    return jsonify({"error": "Not found"}), 404


@app.get("/api/health")
def health():
    """Check API availability and verify Oracle can answer a simple query."""
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM dual")
            value = cursor.fetchone()[0]
        return jsonify({"api": "ok", "oracle": "ok", "oracle_test_value": value})
    finally:
        connection.close()


@app.get("/api/currencies")
def currencies():
    rows = query_rows(
        """SELECT CurrencyID, Name, Symbol, BuyRate, SellRate, Status
           FROM Currencies
           ORDER BY Name"""
    )
    return jsonify(rows)


@app.get("/api/customers")
def customers():
    rows = query_rows(
        """SELECT CustomerID, Name, FatherName, Phone, Address, IDNumber, Status
           FROM Customers
           ORDER BY CustomerID DESC"""
    )
    return jsonify(rows)


@app.post("/api/customers")
def create_customer():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    if not name:
        return jsonify({"error": "Customer name is required."}), 400

    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            customer_id = cursor.var(oracledb.NUMBER)
            cursor.execute(
                """INSERT INTO Customers
                   (Name, FatherName, Phone, Address, IDNumber)
                   VALUES (:name, :father_name, :phone, :address, :id_number)
                   RETURNING CustomerID INTO :customer_id""",
                {
                    "name": name,
                    "father_name": data.get("father_name"),
                    "phone": data.get("phone"),
                    "address": data.get("address"),
                    "id_number": data.get("id_number"),
                    "customer_id": customer_id,
                },
            )
            new_id = int(customer_id.getvalue()[0])
        connection.commit()
        return jsonify({"message": "Customer created.", "customer_id": new_id}), 201
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@app.put("/api/customers/<int:customer_id>")
def update_customer(customer_id):
    """Update a customer's editable details."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON object is required."}), 400

    allowed = {
        "name": "Name",
        "father_name": "FatherName",
        "phone": "Phone",
        "address": "Address",
        "id_number": "IDNumber",
    }
    updates = {
        column: data[key].strip() if isinstance(data.get(key), str) else data.get(key)
        for key, column in allowed.items()
        if key in data
    }
    if not updates:
        return jsonify({"error": "No customer fields were provided."}), 400
    if "Name" in updates and not updates["Name"]:
        return jsonify({"error": "Customer name cannot be empty."}), 400

    set_clause = ", ".join(f"{column} = :{column}" for column in updates)
    params = dict(updates)
    params["customer_id"] = customer_id

    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                f"UPDATE Customers SET {set_clause} "
                "WHERE CustomerID = :customer_id AND Status = 'Active'",
                params,
            )
            if cursor.rowcount == 0:
                connection.rollback()
                return jsonify({"error": "Active customer not found."}), 404
        connection.commit()
        return jsonify({"message": "Customer updated.", "customer_id": customer_id})
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@app.delete("/api/customers/<int:customer_id>")
def deactivate_customer(customer_id):
    """Soft-delete a customer so transaction history and foreign keys remain safe."""
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """UPDATE Customers
                   SET Status = 'Inactive'
                   WHERE CustomerID = :customer_id AND Status = 'Active'""",
                {"customer_id": customer_id},
            )
            if cursor.rowcount == 0:
                connection.rollback()
                return jsonify({"error": "Active customer not found."}), 404
        connection.commit()
        return jsonify({
            "message": "Customer deactivated.",
            "customer_id": customer_id,
        })
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@app.errorhandler(oracledb.Error)
def handle_oracle_error(error):
    app.logger.exception("Oracle database error")
    return jsonify({"error": "Database operation failed. Check the server log."}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
