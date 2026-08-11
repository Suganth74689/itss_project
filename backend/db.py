import os
import duckdb
import threading
from pathlib import Path

# Path to dataset directory
BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset"
DATA_DIR = BASE_DIR / "data"

_master_conn = None
_db_lock = threading.Lock()

def get_master_db():
    global _master_conn
    with _db_lock:
        if _master_conn is None:
            # In-memory DuckDB connection
            _master_conn = duckdb.connect(database=":memory:", read_only=False)
            init_db(_master_conn)
        return _master_conn

def get_db():
    """
    Returns a thread-safe cursor from the master DuckDB connection.
    This guarantees concurrent HTTP requests in FastAPI threadpool never collide.
    """
    master = get_master_db()
    with _db_lock:
        return master.cursor()

def init_db(conn, force_reload: bool = False):
    """
    Load all 6 CSV files into DuckDB in-memory database tables.
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
        table_exists = False
        if not force_reload:
            try:
                res = conn.execute(f"SELECT count(*) FROM information_schema.tables WHERE table_name = '{table}'").fetchone()
                table_exists = (res and res[0] > 0)
            except Exception:
                table_exists = False
        
        if not table_exists or force_reload:
            csv_path = DATASET_DIR / f"{table}.csv"
            if not csv_path.exists():
                raise FileNotFoundError(f"Required dataset file not found: {csv_path}")
            
            # Load CSV into DuckDB with automatic schema inference
            conn.execute(f"""
                CREATE OR REPLACE TABLE {table} AS 
                SELECT * FROM read_csv_auto('{csv_path}', header=True, ignore_errors=False)
            """)

def reset_db():
    """
    Force reload all tables from raw CSV files safely under lock.
    """
    with _db_lock:
        master = get_master_db()
        init_db(master, force_reload=True)
        return True

if __name__ == "__main__":
    conn = get_db()
    print("Thread-safe in-memory DuckDB initialized successfully.")
