import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from schemas import FaqQueryRequest
from services.faq_service import FaqService

def run_accuracy_tests():
    print("=" * 70)
    print("RUNNING B3 NEXUS RAG & OLLAMA ASSISTANT ACCURACY VERIFICATION")
    print("=" * 70)

    # Test 1: "how many loan account this user have" for Customer #100106
    req1 = FaqQueryRequest(question="how many loan account this user have", customer_id=100106)
    res1 = FaqService.answer_faq(req1)
    
    print("\n[TEST 1] Query: 'how many loan account this user have' (Customer #100106)")
    print(f"Status: {res1.status} | Query Type: {res1.query_type} | Provider: {res1.llm_provider}")
    print(f"Customer Name: {res1.customer_name}")
    print("Answer Output:")
    print(res1.answer)
    print("-" * 70)

    assert res1.status == "MATCHED", "Test 1 failed: status should be MATCHED"
    assert res1.query_type == "CUSTOMER_SPECIFIC", "Test 1 failed: query_type should be CUSTOMER_SPECIFIC"
    assert "2" in res1.answer or "two" in res1.answer.lower(), "Test 1 failed: Answer must state 2 loan accounts"

    # Test 2: General EMI calculation policy FAQ
    req2 = FaqQueryRequest(question="how is loan emi calculated?", customer_id=None)
    res2 = FaqService.answer_faq(req2)
    
    print("\n[TEST 2] Query: 'how is loan emi calculated?' (No Customer ID)")
    print(f"Status: {res2.status} | Query Type: {res2.query_type} | Matched FAQ ID: {res2.matched_faq.id if res2.matched_faq else None}")
    print("Answer Output:")
    print(res2.answer)
    print("-" * 70)

    assert res2.status == "MATCHED", "Test 2 failed: status should be MATCHED"
    assert res2.matched_faq and res2.matched_faq.id == "FAQ006", "Test 2 failed: Should match FAQ006"

    # Test 3: Guardrail refusal
    req3 = FaqQueryRequest(question="who is the prime minister of india?", customer_id=100106)
    res3 = FaqService.answer_faq(req3)

    print("\n[TEST 3] Query: 'who is the prime minister of india?' (Guardrail Test)")
    print(f"Status: {res3.status} | Refusal Reason: {res3.refusal_reason}")
    print("-" * 70)

    assert res3.status == "REFUSED", "Test 3 failed: status should be REFUSED"

    print("\n✅ ALL ACCURACY VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_accuracy_tests()
