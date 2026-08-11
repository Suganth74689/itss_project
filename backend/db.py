import os
import duckdb
from pathlib import Path

# Path to dataset directory and persistent DB file
BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset"
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "banking.duckdb"

_conn = None

def get_db():
    global _conn
    if _conn is None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        _conn = duckdb.connect(database=str(DB_PATH), read_only=False)
        init_db(_conn)
    return _conn

def init_db(conn, force_reload: bool = False):
    """
    Load all 6 CSV files into persistent DuckDB database tables if not already existing.
    If force_reload is True, re-creates tables from raw CSV files.
    """
    tables = [
        "customers",
        "accounts",
        "loans",
        "transactions",
        "loan_applications",
        "limits_collateral"
    ]
    
    for table in tables:
        # Check if table already exists in persistent database
        table_exists = False
        if not force_reload:
            res = conn.execute(f"SELECT count(*) FROM information_schema.tables WHERE table_name = '{table}'").fetchone()
            table_exists = (res[0] > 0)
        
        if not table_exists or force_reload:
            csv_path = DATASET_DIR / f"{table}.csv"
            if not csv_path.exists():
                raise FileNotFoundError(f"Required dataset file not found: {csv_path}")
            
            # Load CSV into DuckDB with automatic schema inference
            conn.execute(f"""
                CREATE OR REPLACE TABLE {table} AS 
                SELECT * FROM read_csv_auto('{csv_path}', header=True, ignore_errors=False)
            """)
            print(f"Loaded table '{table}' from CSV.")

def reset_db():
    """
    Force reload all tables from raw CSV files.
    """
    conn = get_db()
    init_db(conn, force_reload=True)
    return True

if __name__ == "__main__":
    conn = get_db()
    print("Persistent DuckDB initialized successfully at:", DB_PATH)
