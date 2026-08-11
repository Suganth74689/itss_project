import sys
import concurrent.futures
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from services.customer_service import CustomerService
from services.kyc_service import KycService
from services.similarity_service import CustomerSimilarityService
from db import get_db

def run_concurrent_query(customer_id: int):
    # Perform all 3 services concurrently for a customer
    c360 = CustomerService.get_customer_360(customer_id)
    kyc = KycService.evaluate_customer_kyc(customer_id)
    lookalikes = CustomerSimilarityService.get_lookalikes(customer_id)
    
    if c360 is None or kyc is None or lookalikes is None:
        return (customer_id, False, "Returned None")
    return (customer_id, True, f"OK - {c360.customer.name_1}")

def test_high_concurrency():
    print("==================================================")
    print("  TESTING HIGH CONCURRENCY DUCKDB THREAD SAFETY   ")
    print("==================================================")

    test_ids = [100100, 100101, 100102, 100103, 100106, 100111, 100113, 100116, 100120, 100125] * 3
    print(f"Executing {len(test_ids)} concurrent query operations across 10 worker threads...")

    success_count = 0
    failures = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(run_concurrent_query, cid) for cid in test_ids]
        for future in concurrent.futures.as_completed(futures):
            cid, ok, msg = future.result()
            if ok:
                success_count += 1
            else:
                failures.append((cid, msg))

    print(f"\nCONCURRENCY TEST RESULTS:")
    print(f"  Success: {success_count}/{len(test_ids)}")
    print(f"  Failures: {len(failures)}")

    assert len(failures) == 0
    print("\nHIGH CONCURRENCY DUCKDB THREAD SAFETY TEST PASSED PERFECTLY!")

if __name__ == "__main__":
    test_high_concurrency()
