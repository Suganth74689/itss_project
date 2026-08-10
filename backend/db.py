import os
import duckdb
from pathlib import Path

# Path to dataset directory
BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset"

_conn = None

def get_db():
    global _conn
    if _conn is None:
        _conn = duckdb.connect(database=":memory:", read_only=False)
        init_db(_conn)
    return _conn

def init_db(conn):
    """
    Load all 6 CSV files into DuckDB in-memory database tables.
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
        csv_path = DATASET_DIR / f"{table}.csv"
        if not csv_path.exists():
            raise FileNotFoundError(f"Required dataset file not found: {csv_path}")
        
        # Load CSV into DuckDB with automatic schema inference
        conn.execute(f"""
            CREATE OR REPLACE TABLE {table} AS 
            SELECT * FROM read_csv_auto('{csv_path}', header=True, ignore_errors=False)
        """)
        
    # Verify loaded row counts
    print("--- DuckDB Dataset Initialization Complete ---")
    for table in tables:
        count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"Table '{table}': {count} records loaded.")

if __name__ == "__main__":
    conn = get_db()
    print("Database initialized successfully!")
