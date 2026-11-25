"""Backward-compatible Oracle connection entry point.

Set ORACLE_USER, ORACLE_PASSWORD and ORACLE_DSN in your environment.
"""
from database.connection import get_connection

if __name__ == "__main__":
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM dual")
            print("Oracle connection successful:", cursor.fetchone()[0])
