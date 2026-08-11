import os
import duckdb
import threading
from pathlib import Path
from typing import List, Dict, Any, Optional

# Path to dataset directory
BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset"
DATA_DIR = BASE_DIR / "data"

_master_conn = None
_db_lock = threading.Lock()

def get_master_db():
    global _master_conn
    if _master_conn is None:
        _master_conn = duckdb.connect(database=":memory:", read_only=False)
        init_db(_master_conn)
    return _master_conn

def get_db():
    """
    Returns master connection for backwards compatibility.
    """
    return get_master_db()

def fetch_all_dict(sql: str, params: list = None) -> List[Dict[str, Any]]:
    """
    Thread-safe execution returning a list of dictionaries keyed by column name.
    """
    with _db_lock:
        conn = get_master_db()
        cur = conn.cursor()
        res = cur.execute(sql, params or [])
        cols = [d[0] for d in res.description]
        rows = res.fetchall()
        return [dict(zip(cols, r)) for r in rows]

def fetch_one_dict(sql: str, params: list = None) -> Optional[Dict[str, Any]]:
    """
    Thread-safe execution returning a single dictionary keyed by column name.
    """
    with _db_lock:
        conn = get_master_db()
        cur = conn.cursor()
        res = cur.execute(sql, params or [])
        if not res.description:
            return None
        cols = [d[0] for d in res.description]
        r = res.fetchone()
        if not r:
            return None
        return dict(zip(cols, r))

def execute_write(sql: str, params: list = None) -> int:
    """
    Thread-safe execution of UPDATE/INSERT/DELETE statements.
    """
    with _db_lock:
        conn = get_master_db()
        cur = conn.cursor()
        res = cur.execute(sql, params or [])
        return res.rowcount if hasattr(res, 'rowcount') else 1

def init_db(conn, force_reload: bool = False):
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
    res = fetch_one_dict("SELECT * FROM customers LIMIT 1")
    print("Thread-safe dictionary DuckDB test passed:", res["name_1"])
