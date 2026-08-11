import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from services.kyc_service import KycService
from services.customer_service import CustomerService
from schemas import KycVerifyDocumentRequest
from db import reset_db

def test_dynamic_kyc():
    print("==================================================")
    print("  TESTING DYNAMIC DUCKDB KYC DOCUMENT VERIFICATION ")
    print("==================================================")

    # 1. Reset database to initial state
    reset_db()

    # 2. Check Customer 100100 before verification
    kyc_before = KycService.evaluate_customer_kyc(100100)
    print("Customer 100100 Before Verification:")
    print(f"  KYC Status: {kyc_before.overall_status}")
    print(f"  Completeness: {kyc_before.completeness_percentage}%")
    print(f"  Missing Fields: {kyc_before.missing_fields}")
    assert kyc_before.overall_status == "EXPIRED"
    assert kyc_before.completeness_percentage < 100.0

    # 3. Perform dynamic document verification
    print("\nExecuting Dynamic Document Verification (SQL UPDATE)...")
    req = KycVerifyDocumentRequest(
        document_type="Government Issued ID (PAN/Aadhaar)",
        document_number="PAN-RSHARMA-2026-X",
        notes="Verified and signed Re-KYC declaration submitted by customer."
    )
    res = KycService.verify_customer_document(100100, req)
    print("Verification API Response:")
    print(f"  Success: {res.success}")
    print(f"  Message: {res.message}")
    assert res.success is True

    # 4. Check Customer 100100 after verification
    kyc_after = res.updated_assessment
    print("\nCustomer 100100 After Verification:")
    print(f"  KYC Status: {kyc_after.overall_status}")
    print(f"  Completeness: {kyc_after.completeness_percentage}%")
    print(f"  Missing Fields: {kyc_after.missing_fields}")
    assert kyc_after.overall_status == "COMPLETE"
    assert kyc_after.completeness_percentage == 100.0
    assert len(kyc_after.missing_fields) == 0

    # 5. Verify Customer 360 profile dynamically reflects the update from DuckDB
    c360 = CustomerService.get_customer_360(100100)
    print("\nCustomer 360 Verification from DuckDB:")
    print(f"  Profile KYC Status: {c360.customer.kyc_status}")
    assert c360.customer.kyc_status == "COMPLETE"

    print("\nDYNAMIC DUCKDB PERSISTENCE AND VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_dynamic_kyc()
