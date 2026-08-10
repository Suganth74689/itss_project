import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from services.customer_service import CustomerService

def test_customer_360():
    print("Testing Customer 360 for customer 100100 (Rajesh Sharma)...")
    res100 = CustomerService.get_customer_360(100100)
    assert res100 is not None, "Customer 100100 not found!"
    print(f"Customer Name: {res100.customer.name_1}")
    print(f"Accounts Count: {len(res100.accounts)}")
    print(f"Total Working Balance: ₹{res100.total_working_balance:,.2f}")
    print(f"Loans Count: {len(res100.loans)}")
    print(f"Transactions Count: {len(res100.transactions)}")
    print(f"Suspicious Txns Count: {res100.suspicious_txn_count}")
    print(f"Citations Generated: {len(res100.citations)}")
    print("Sample Citation:", res100.citations[0])

    print("\nTesting Customer 360 for customer 100106...")
    res106 = CustomerService.get_customer_360(100106)
    assert res106 is not None, "Customer 100106 not found!"
    print(f"Customer Name: {res106.customer.name_1}")
    print(f"Outstanding Loans: ₹{res106.total_outstanding_loan:,.2f}")
    print(f"Available Credit Limit: ₹{res106.total_available_limit:,.2f}")

    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_customer_360()
