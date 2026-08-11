import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from services.kyc_service import KycService
from services.faq_service import FaqService
from schemas import FaqQueryRequest

def test_phase2():
    print("==================================================")
    print("     TESTING B2: KYC COMPLETENESS ASSISTANT     ")
    print("==================================================")
    
    # Test Customer 100100 (EXPIRED status)
    kyc100 = KycService.evaluate_customer_kyc(100100)
    assert kyc100 is not None, "Customer 100100 not found"
    print(f"Customer 100100 ({kyc100.name_1}):")
    print(f"  Overall Status: {kyc100.overall_status}")
    print(f"  Completeness Percentage: {kyc100.completeness_percentage}%")
    print(f"  Categories Total: {len(kyc100.categories)}")
    print(f"  Missing Fields: {kyc100.missing_fields}")
    print(f"  Recommended Actions: {kyc100.recommended_actions[:2]}")
    assert kyc100.overall_status == "EXPIRED"

    # Test Customer 100102 (COMPLETE status)
    kyc102 = KycService.evaluate_customer_kyc(100102)
    assert kyc102 is not None, "Customer 100102 not found"
    print(f"\nCustomer 100102 ({kyc102.name_1}):")
    print(f"  Overall Status: {kyc102.overall_status}")
    print(f"  Completeness Percentage: {kyc102.completeness_percentage}%")
    assert kyc102.overall_status == "COMPLETE"
    assert kyc102.completeness_percentage == 100.0

    print("\n==================================================")
    print("        TESTING B3: BANK FAQ ASSISTANT           ")
    print("==================================================")

    # Test Valid Banking FAQ Query
    valid_req = FaqQueryRequest(question="What documents are required to open a savings account?")
    res1 = FaqService.answer_faq(valid_req)
    print(f"Valid Query: '{valid_req.question}'")
    print(f"  Status: {res1.status}")
    print(f"  Confidence: {res1.confidence_score}")
    print(f"  Matched FAQ ID: {res1.matched_faq.id if res1.matched_faq else None}")
    print(f"  Citation Record: {res1.citations[0].record_id if res1.citations else None}")
    assert res1.status == "MATCHED"
    assert res1.matched_faq is not None
    assert res1.matched_faq.id == "FAQ001"

    # Test Out-of-Scope Guardrail Refusal 1 (Trivia)
    refuse_req1 = FaqQueryRequest(question="Who is the Prime Minister of India?")
    res2 = FaqService.answer_faq(refuse_req1)
    print(f"\nOut-of-Scope Query 1: '{refuse_req1.question}'")
    print(f"  Status: {res2.status}")
    print(f"  Refusal Reason: {res2.refusal_reason}")
    assert res2.status == "REFUSED"
    assert res2.matched_faq is None

    # Test Out-of-Scope Guardrail Refusal 2 (Programming)
    refuse_req2 = FaqQueryRequest(question="Write Python code for quicksort algorithm")
    res3 = FaqService.answer_faq(refuse_req2)
    print(f"\nOut-of-Scope Query 2: '{refuse_req2.question}'")
    print(f"  Status: {res3.status}")
    print(f"  Refusal Reason: {res3.refusal_reason}")
    assert res3.status == "REFUSED"

    print("\nALL PHASE 2 BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_phase2()
