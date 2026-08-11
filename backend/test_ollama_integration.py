import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from services.faq_service import FaqService
from schemas import FaqQueryRequest

def test_ollama_integration():
    print("==================================================")
    print("  TESTING OLLAMA LOCAL LLM & FALLBACK RAG        ")
    print("==================================================")

    # 1. Test Ollama daemon status check
    status = FaqService.check_ollama_status()
    print(f"Ollama Available: {status.available}")
    print(f"URL: {status.url}")
    print(f"Active Local Models: {status.active_models}")
    print(f"Message: {status.message}\n")

    # 2. Query with Customer 360 facts
    req1 = FaqQueryRequest(question="What is my total working balance?", customer_id=100106)
    res1 = FaqService.answer_faq(req1)
    print("Customer RAG Query Output:")
    print(f"  Status: {res1.status}")
    print(f"  LLM Provider: {res1.llm_provider}")
    print(f"  Ollama Available: {res1.ollama_available}")
    print(f"  Answer Snippet:\n{res1.answer[:120]}...\n")
    assert res1.status == "MATCHED"
    assert res1.llm_provider is not None

    # 3. Policy query
    req2 = FaqQueryRequest(question="What are the interest rates for savings accounts?", customer_id=100106)
    res2 = FaqService.answer_faq(req2)
    print("Policy RAG Query Output:")
    print(f"  Status: {res2.status}")
    print(f"  LLM Provider: {res2.llm_provider}")
    print(f"  Answer Snippet:\n{res2.answer[:120]}...\n")
    assert res2.status == "MATCHED"

    print("ALL OLLAMA LOCAL LLM & FALLBACK TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_ollama_integration()
