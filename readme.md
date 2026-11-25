# Smart Currency Exchange & Financial Management System

A currency-exchange and financial-management project. The current repository contains a browser-based frontend (HTML, CSS, JavaScript) and an Oracle Database 19c schema/connection starter.

## Repository structure

- `index.html`, `style.css`, `script.js` — browser frontend.
- `database/table.sql` — Oracle table definitions (review before running).
- `database/triggers.sql` — Oracle triggers.
- `database/connection.py` — Python Oracle connection helper.
- `connection.py` — backward-compatible connection test entry point.

## Python and Oracle setup

1. Install Python 3.10 or newer.
2. Create and activate a virtual environment.
3. Install dependencies: `python -m pip install -r requirements.txt`.
4. Copy `.env.example` to `.env` and enter your own Oracle username, password, and service name.
5. Confirm Oracle Database 19c is running and that the service name in `ORACLE_DSN` is correct.
6. Test the connection: `python connection.py`.

Example DSN: `localhost:1521/XEPDB1`. Some installations use a different service name; use the service configured on your own Oracle server.

## Database setup

The SQL files are starter scripts, not a migration system. Inspect them and take a backup before running them against any database containing existing data. Run table creation before triggers. Do not run sample inserts until the schema and foreign-key IDs have been checked against your own database.

## Security notes

- Never commit `.env`, database passwords, API keys, or real customer information.
- The frontend currently contains browser-side demo/local-storage behavior; it is not a secure production authentication system.
- Do not use demo credentials or placeholder password hashes for real accounts.

## Current integration status

The Python connection helper is configured, but a live Oracle connection has not yet been verified from this GitHub environment. The next integration step is to compare the frontend data model with the Oracle schema, then add a backend API and test it against the actual Oracle 19c instance.
