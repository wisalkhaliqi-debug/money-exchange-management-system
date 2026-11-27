# Local Oracle 19c Connection Checklist

This checklist verifies the Oracle connection on the developer's own computer.
It does not claim that the connection has already been tested.

## 1. Prepare the local environment

From the project root, install the dependencies:

```bash
python -m pip install -r requirements.txt
```

Copy `.env.example` to a new file named `.env`. Edit only the local
`.env` file and set:

```dotenv
ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_DSN=localhost:1521/XEPDB1
```

Use the actual service name configured in your Oracle installation. The
example DSN is only a default example; it may differ on your computer.

**Security:** Never commit `.env`, paste database passwords into issues, or
send credentials in chat. Keep `.env.example` filled with placeholders.

## 2. Check the connection

Run this command from the project root:

```bash
python connection.py
```

A successful run prints:

```text
Oracle connection successful: 1
```

The script executes `SELECT 1 FROM dual`. It verifies connectivity and
authentication; it does not validate the application's tables or data model.

## 3. Troubleshoot common errors

- **Missing ORACLE_USER / ORACLE_PASSWORD:** confirm that the local file is
  named exactly `.env`, is in the project root, and contains both values.
- **ORA-12154 / ORA-12514:** check the DSN and service name. Confirm that the
  Oracle listener is running.
- **ORA-01017:** check the username and password. Do not include extra quotes
  around the values in `.env`.
- **Connection refused / timeout:** confirm the database host and port
  (commonly 1521) and that the listener is reachable.
- **ModuleNotFoundError:** activate the intended Python environment and rerun
  `python -m pip install -r requirements.txt`.

## 4. Record the result

After running the command, record one of these outcomes in your project notes:

- PASS — the command printed `Oracle connection successful: 1`.
- FAIL — copy the exact error message, but remove usernames, passwords,
  hostnames, and other private connection details before sharing it.

Do not mark Oracle connectivity as verified until the command has actually
run successfully against the intended Oracle database.
