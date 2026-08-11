import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from services.similarity_service import CustomerSimilarityService

def test_b4_lookalikes():
    print("==================================================")
    print("  TESTING MODULE B4 LOOKALIKE CUSTOMER EXPLAINER  ")
    print("==================================================")

    # Test Customer 100106 (Vikram Pillai)
    target_id = 100106
    res = CustomerSimilarityService.get_lookalikes(target_id, top_n=5)
    
    assert res is not None
    print(f"Target Customer: {res.target_customer_name} (ID: {res.target_customer_id})")
    print(f"Found {len(res.lookalikes)} Top Lookalikes:\n")

    for i, match in enumerate(res.lookalikes, 1):
        print(f"[{i}] Customer #{match.customer_id} - {match.name_1}")
        print(f"    Similarity Match: {match.similarity_pct}%")
        print(f"    Monthly Income: ₹{match.monthly_income:,.0f} | KYC: {match.kyc_status} | DPD: {match.max_days_past_due} Days")
        print(f"    Why Similar Checklist:")
        for feat in match.matching_features:
            print(f"      ✓ {feat}")
        print(f"    Caution / Risk Discrepancies:")
        for risk in match.risk_discrepancies:
            print(f"      {risk}")
        print("-" * 50)

    assert len(res.lookalikes) == 5
    assert res.lookalikes[0].similarity_pct >= 75.0
    print("\nMODULE B4 LOOKALIKE EXPLAINER TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_b4_lookalikes()
