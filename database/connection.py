"""Oracle Database 19c connection helper.

Configuration is read from environment variables:
  ORACLE_USER      Database username
  ORACLE_PASSWORD  Database password
  ORACLE_DSN       Easy Connect DSN, e.g. localhost:1521/XEPDB1

Never commit real credentials. Keep them in local environment variables or
an untracked .env file.
"""
from __future__ import annotations

import os
import oracledb

try:
    from dotenv import load_dotenv
except ImportError:  # python-dotenv is optional
    load_dotenv = None

if load_dotenv is not None:
    load_dotenv()


def get_connection():
    """Open and return an Oracle connection or raise a clear configuration error."""
    user = os.getenv("ORACLE_USER")
    password = os.getenv("ORACLE_PASSWORD")
    dsn = os.getenv("ORACLE_DSN", "localhost:1521/XEPDB1")

    missing = [
        name for name, value in (
            ("ORACLE_USER", user),
            ("ORACLE_PASSWORD", password),
        ) if not value
    ]
    if missing:
        raise RuntimeError(
            "Missing Oracle configuration: " + ", ".join(missing)
            + ". Set these environment variables or create a local .env file."
        )

    return oracledb.connect(user=user, password=password, dsn=dsn)


if __name__ == "__main__":
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM dual")
            print("Oracle connection successful:", cursor.fetchone()[0])
