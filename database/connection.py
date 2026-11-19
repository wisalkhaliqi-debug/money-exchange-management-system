import oracledb

def get_connection():
    try:
        connection = oracledb.connect(
            user="YOUR_USERNAME",
            password="YOUR_PASSWORD",
            dsn="localhost:1521/XEPDB1"
        )
        print("Oracle Database Connected Successfully!")
        return connection

    except Exception as error:
        print("Database Connection Error:", error)
        return None
