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

The API expects the Oracle tables in `database/table.sql` to exist. It reuses `database.connection.get_connection()`; it does not require a second database connection implementation.

## Database safety

The SQL files are starter scripts, not a migration system. Review them and back up existing data before running scripts. Never commit `.env`, database passwords, API keys, or real customer information. The frontend's existing localStorage/demo login is not production-secure.

## Integration status

The initial Flask API scaffold and read/list/create endpoints have been added. They have **not** been tested against the user's local Oracle 19c instance or browser environment. The next step is to verify the API locally, then connect the frontend Customers and Currencies screens to these endpoints.
