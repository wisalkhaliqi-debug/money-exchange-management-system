# Smart Currency Exchange & Financial Management System

A currency-exchange and financial-management project with a browser frontend, Flask API, and Oracle Database 19c.

## Repository structure

- `index.html`, `style.css`, `script.js` — browser frontend.
- `backend/app.py` — initial Flask API.
- `database/table.sql` — Oracle table definitions (review before running).
- `database/triggers.sql` — Oracle triggers.
- `database/connection.py` — shared Oracle connection helper.
- `connection.py` — Oracle connection check entry point.

## Install dependencies

1. Use Python 3.10 or newer.
2. Create and activate a virtual environment.
3. Install packages: `python -m pip install -r requirements.txt`.
4. Configure Oracle credentials using the environment variables documented in `.env.example` (or your existing working local configuration).

## Run the application

From the repository root:

```bash
python -m backend.app
```

Open `http://127.0.0.1:5000` in your browser.

Initial API endpoints:

- `GET /api/health` — API and Oracle connectivity check.
- `GET /api/currencies` — list currencies.
- `GET /api/customers` — list customers.
- `POST /api/customers` — create a customer using JSON fields: `name`, `father_name`, `phone`, `address`, `id_number`.
- `PUT /api/customers/<customer_id>` — update one or more supplied customer fields.
- `DELETE /api/customers/<customer_id>` — deactivate a customer (`Status = 'Inactive'`) without physically deleting historical records.

Customer update/delete endpoints only operate on active customers. A missing or inactive customer returns HTTP 404. The API validates that a customer name is present and cannot be changed to an empty value.

The API expects the Oracle tables in `database/table.sql` to exist. It reuses `database.connection.get_connection()`; it does not require a second database connection implementation.

## Database safety

The SQL files are starter scripts, not a migration system. Review them and back up existing data before running scripts. Never commit `.env`, database passwords, API keys, or real customer information. The frontend's existing localStorage/demo login is not production-secure.

## Integration status

- The Customers screen now loads active customers from `GET /api/customers` after a successful login.
- The Add Customer form sends new records to `POST /api/customers`.
- Customer update and deactivate API endpoints are available, but edit/deactivate controls are not yet connected in the frontend.
- The Currencies screen is not yet connected to the API.
- Customer `Notes` remain in this browser's local storage because the current Oracle `Customers` table has no Notes column.

The browser/API integration and Oracle connection have **not** yet been tested on the user's computer against Oracle 19c. The next step is to install the dependencies from the repository root, configure the local `.env`, and run the Flask health check before testing customer creation.
