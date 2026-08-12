import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from services.faq_service import FaqService
from schemas import FaqQueryRequest

def test_b3_rag_chat():
    print("==================================================")
    print("  TESTING B3 CONTEXT-AWARE CUSTOMER RAG CHAT      ")
    print("==================================================")

    # 1. Specific Balance query for Customer 100106
    req1 = FaqQueryRequest(question="What is my total working balance?", customer_id=100106)
    res1 = FaqService.answer_faq(req1)
    print("Test 1: Specific Working Balance Query for Customer 100106")
    print(f"  Status: {res1.status} | Type: {res1.query_type}")
    print(f"  Answer:\n{res1.answer}")
    assert res1.status == "MATCHED"
    assert res1.query_type == "CUSTOMER_SPECIFIC"
    assert "Total Aggregated Working Balance" in res1.answer
    assert "LOAN APPLICATIONS HISTORY" not in res1.answer  # Should NOT include unrelated sections
    print("✓ Test 1 Passed!\n")

    # 2. Specific Loan DPD query for Customer 100106
    req2 = FaqQueryRequest(question="How many loan accounts do I have and do I have overdue DPD?", customer_id=100106)
    res2 = FaqService.answer_faq(req2)
    print("Test 2: Specific Loan & DPD Query for Customer 100106")
    print(f"  Status: {res2.status} | Type: {res2.query_type}")
    print(f"  Answer:\n{res2.answer}")
    assert res2.status == "MATCHED"
    assert "Active Loan Accounts Count" in res2.answer
    assert "DEPOSIT & SAVINGS ACCOUNTS" not in res2.answer  # Should NOT include unrelated sections
    print("✓ Test 2 Passed!\n")

    # 3. Explicit "Show all details" query
    req3 = FaqQueryRequest(question="Show all details for customer 100106", customer_id=100106)
    res3 = FaqService.answer_faq(req3)
    print("Test 3: Explicit Full Dataset Details Request")
    print(f"  Status: {res3.status} | Type: {res3.query_type}")
    assert res3.status == "MATCHED"
    assert "COMPLETE CUSTOMER 360° DATASET REPORT" in res3.answer
    assert "DEPOSIT & SAVINGS ACCOUNTS" in res3.answer
    assert "LOAN ACCOUNTS & CREDIT FACILITIES" in res3.answer
    assert "REGULATORY KYC COMPLIANCE ASSESSMENT" in res3.answer
    print("✓ Test 3 Passed!\n")

    # 4. Strict SQL Query Guardrail Refusal Test
    req4 = FaqQueryRequest(question="SELECT * FROM customers WHERE customer_id = 100106;", customer_id=100106)
    res4 = FaqService.answer_faq(req4)
    print("Test 4: SQL Query Guardrail Refusal")
    print(f"  Status: {res4.status} | Type: {res4.query_type}")
    assert res4.status == "REFUSED"
    assert res4.answer is None
    print("✓ Test 4 Passed!\n")

    # 5. Out-of-Scope Non-Banking Refusal Query
    req5 = FaqQueryRequest(question="Who is the prime minister of India?", customer_id=100106)
    res5 = FaqService.answer_faq(req5)
    print("Test 5: Non-Banking Out-of-Scope Refusal Query")
    print(f"  Status: {res5.status} | Type: {res5.query_type}")
    assert res5.status == "REFUSED"
    print("✓ Test 5 Passed!\n")

    print("ALL B3 CONTEXT-AWARE CUSTOMER RAG CHAT TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_b3_rag_chat()
