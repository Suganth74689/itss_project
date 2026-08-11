import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from services.faq_service import FaqService
from schemas import FaqQueryRequest

def test_b3_rag_chat():
    print("==================================================")
    print("  TESTING B3 CONTEXT-AWARE CUSTOMER RAG CHAT      ")
    print("==================================================")

    # 1. Customer-specific query for Customer 100106 (Vikram Pillai)
    req1 = FaqQueryRequest(question="What is my total working balance?", customer_id=100106)
    res1 = FaqService.answer_faq(req1)
    print("Test 1: Customer-Specific Balance Query for 100106")
    print(f"  Status: {res1.status} | Type: {res1.query_type}")
    print(f"  Customer: {res1.customer_name} (ID: {res1.customer_id})")
    print(f"  Answer:\n{res1.answer}")
    print(f"  Citations Count: {len(res1.citations)}")
    assert res1.status == "MATCHED"
    assert res1.query_type == "CUSTOMER_SPECIFIC"
    assert res1.customer_id == 100106
    assert "₹" in res1.answer
    assert len(res1.citations) > 0
    print("✓ Test 1 Passed!\n")

    # 2. KYC query for Customer 100101 (Priya Verma)
    req2 = FaqQueryRequest(question="Is my KYC status complete or expired?", customer_id=100101)
    res2 = FaqService.answer_faq(req2)
    print("Test 2: Customer-Specific KYC Query for 100101")
    print(f"  Status: {res2.status} | Type: {res2.query_type}")
    print(f"  Answer:\n{res2.answer}")
    assert res2.status == "MATCHED"
    assert res2.query_type == "CUSTOMER_SPECIFIC"
    assert "EXPIRED" in res2.answer
    print("✓ Test 2 Passed!\n")

    # 3. Banking Policy Query
    req3 = FaqQueryRequest(question="What are the interest rates for home loans?", customer_id=100106)
    res3 = FaqService.answer_faq(req3)
    print("Test 3: Banking Policy RAG Query")
    print(f"  Status: {res3.status} | Type: {res3.query_type}")
    print(f"  Matched FAQ: {res3.matched_faq.question if res3.matched_faq else None}")
    assert res3.status == "MATCHED"
    assert res3.query_type == "BANKING_FAQ"
    assert res3.matched_faq is not None
    print("✓ Test 3 Passed!\n")

    # 4. Out-of-Scope Non-Banking Refusal Query
    req4 = FaqQueryRequest(question="Who is the prime minister of India?", customer_id=100106)
    res4 = FaqService.answer_faq(req4)
    print("Test 4: Non-Banking Out-of-Scope Refusal Query")
    print(f"  Status: {res4.status} | Type: {res4.query_type}")
    print(f"  Refusal Reason: {res4.refusal_reason}")
    assert res4.status == "REFUSED"
    assert res4.query_type == "REFUSED"
    print("✓ Test 4 Passed!\n")

    print("ALL B3 CONTEXT-AWARE CUSTOMER RAG CHAT TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_b3_rag_chat()
