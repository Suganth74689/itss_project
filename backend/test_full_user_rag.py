import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from schemas import FaqQueryRequest
from services.faq_service import FaqService

def run_full_rag_tests():
    print("=" * 75)
    print("RUNNING B3 FULL DATABASE USER INFORMATION RAG ACCURACY TEST SUITE")
    print("=" * 75)

    prompts = [
        ("what is my address and nationality?", ["81 MARINE DRIVE", "KOCHI/IN"]),
        ("what is my credit score and monthly income?", ["38,328", "707"]),
        ("what is the interest rate on my personal loan?", ["11.9%", "13.9%"]),
        ("how many active deposit accounts do I have and what are their balances?", ["823,030.47", "1,659,479.87"]),
        ("tell me all information about me", ["VIKRAM PILLAI", "100106", "DEPOSIT & SAVINGS ACCOUNTS", "LOAN ACCOUNTS"])
    ]

    for idx, (prompt, expected_keywords) in enumerate(prompts, 1):
        req = FaqQueryRequest(question=prompt, customer_id=100106)
        res = FaqService.answer_faq(req)

        print(f"\n[PROMPT {idx}] '{prompt}'")
        print(f"Status: {res.status} | Query Type: {res.query_type} | Provider: {res.llm_provider}")
        print("Answer Output Snippet:")
        print(res.answer[:300] + ("..." if len(res.answer) > 300 else ""))
        print("-" * 75)

        assert res.status == "MATCHED", f"Prompt {idx} failed: status should be MATCHED"
        assert res.query_type == "CUSTOMER_SPECIFIC", f"Prompt {idx} failed: query_type should be CUSTOMER_SPECIFIC"
        
        for kw in expected_keywords:
            assert kw.lower() in res.answer.lower(), f"Prompt {idx} failed: Answer missing expected keyword '{kw}'"

    print("\n✅ ALL FULL DATABASE RAG PROMPT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_full_rag_tests()
