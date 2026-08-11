import json
import re
import urllib.request
import urllib.error
from pathlib import Path
from typing import List, Dict, Any, Optional

from schemas import (
    FaqItem, FaqQueryRequest, FaqQueryResponse, CitationEvidence, OllamaStatusResponse
)
from services.customer_service import CustomerService
from services.kyc_service import KycService

BASE_DIR = Path(__file__).resolve().parent.parent
FAQS_PATH = BASE_DIR / "data" / "faqs.json"

OLLAMA_API_BASE = "http://127.0.0.1:11434"

NON_BANKING_TRIGGERS = [
    "prime minister", "president", "python", "java", "c++", "script",
    "cricket", "football", "ipl", "match", "movie", "cinema", "recipe",
    "weather", "temperature", "tell me a joke", "song", "who won", "capital of"
]

GREETING_TRIGGERS = [
    "hi", "hello", "hey", "help", "who are you", "what can you do", "start", "good morning", "good evening"
]

CUSTOMER_INTENT_TRIGGERS = [
    "my balance", "working balance", "my account", "my loan", "my kyc",
    "kyc status", "overdue", "dpd", "suspicious", "my credit score",
    "my income", "my profile", "my limit", "my emi", "my details",
    "who am i", "my status", "account balance", "loan details", "balance",
    "how many loan", "how many loans", "loan account", "loan accounts",
    "number of loans", "number of loan", "how many account", "how many accounts",
    "number of accounts", "this user", "user have", "user has", "customer have",
    "customer has", "do i have", "how much loan", "how much balance", "my transactions",
    "loans", "accounts", "profile", "summary", "details", "loan"
]

class FaqService:
    _faqs: List[FaqItem] = []

    @classmethod
    def load_faqs(cls) -> List[FaqItem]:
        if not cls._faqs:
            if not FAQS_PATH.exists():
                raise FileNotFoundError(f"FAQs configuration file not found at {FAQS_PATH}")
            with open(FAQS_PATH, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                cls._faqs = [FaqItem(**item) for item in raw_data]
        return cls._faqs

    @classmethod
    def list_faqs(cls) -> List[FaqItem]:
        return cls.load_faqs()

    @classmethod
    def check_ollama_status(cls) -> OllamaStatusResponse:
        """
        Check if local Ollama daemon is active on 127.0.0.1:11434.
        Returns installed local models list and connection status.
        """
        try:
            req = urllib.request.Request(f"{OLLAMA_API_BASE}/api/tags", headers={"User-Agent": "FastAPI-Backend"})
            with urllib.request.urlopen(req, timeout=1.2) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    models = [m.get("name") for m in data.get("models", [])]
                    default_m = models[0] if models else "llama3"
                    return OllamaStatusResponse(
                        available=True,
                        url=OLLAMA_API_BASE,
                        active_models=models,
                        default_model=default_m,
                        message=f"Ollama Local LLM server active on port 11434 ({len(models)} local model(s) available)."
                    )
        except Exception:
            pass

        return OllamaStatusResponse(
            available=False,
            url=OLLAMA_API_BASE,
            active_models=[],
            default_model=None,
            message="Ollama server offline on 127.0.0.1:11434. Seamless fallback active using DuckDB RAG Engine."
        )

    @classmethod
    def generate_ollama_completion(cls, user_question: str, context_facts: str, model_name: str = "llama3") -> Optional[str]:
        """
        Synthesize natural generative RAG response via local Ollama LLM.
        Grounded strictly in DuckDB banking context.
        """
        prompt = (
            f"You are an AI Banking Intelligence Assistant. Answer the user's question directly, accurately, and concisely using ONLY the provided verified banking context.\n\n"
            f"Context Data:\n{context_facts}\n\n"
            f"User Question: {user_question}\n\n"
            f"Instructions:\n"
            f"1. Answer the exact question asked (e.g. if asked how many loan accounts the user has, state the exact count and list them).\n"
            f"2. Be professional, clear, and precise with all numbers (counts, balances, interest rates, DPD overdue days, KYC status).\n"
            f"3. Do not invent facts outside the provided context."
        )

        payload = {
            "model": model_name,
            "prompt": prompt,
            "stream": False
        }

        try:
            json_data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                f"{OLLAMA_API_BASE}/api/generate",
                data=json_data,
                headers={"Content-Type": "application/json", "User-Agent": "FastAPI-Backend"}
            )
            with urllib.request.urlopen(req, timeout=12.0) as response:
                if response.status == 200:
                    res_body = json.loads(response.read().decode('utf-8'))
                    return res_body.get("response", "").strip()
        except Exception:
            return None
        return None

    @classmethod
    def answer_faq(cls, req: FaqQueryRequest) -> FaqQueryResponse:
        faqs = cls.load_faqs()
        q_raw = req.question.strip()
        q_lower = q_raw.lower()

        # Check Ollama status
        ollama_status = cls.check_ollama_status()
        ollama_avail = ollama_status.available
        target_model = req.preferred_model or ollama_status.default_model or "llama3"

        # 1. STRICT OUT-OF-SCOPE GUARDRAIL CHECK
        for trigger in NON_BANKING_TRIGGERS:
            if trigger in q_lower:
                return FaqQueryResponse(
                    status="REFUSED",
                    query_type="REFUSED",
                    user_question=q_raw,
                    customer_id=req.customer_id,
                    answer=None,
                    confidence_score="REFUSED",
                    similarity_score=0.0,
                    explanation=f"Out-of-scope query detected matching prohibited trigger '{trigger}'.",
                    refusal_reason="This assistant is strictly restricted to banking policies, customer account 360 data, KYC compliance, and loan inquiries. Non-banking topics (sports, entertainment, coding, politics) are strictly prohibited.",
                    suggested_related_faqs=faqs[:2],
                    citations=[],
                    llm_provider="Refusal Guardrail",
                    ollama_available=ollama_avail,
                    ollama_model=target_model if ollama_avail else None
                )

        # 2. GREETING & GENERAL ASSISTANCE HELP INTENT
        if q_lower in GREETING_TRIGGERS or q_lower.startswith(("hi", "hello", "hey")):
            cust_name = ""
            cid_info = ""
            if req.customer_id:
                c_prof = CustomerService.get_customer_profile(req.customer_id)
                if c_prof:
                    cust_name = f" {c_prof.name_1}"
                    cid_info = f" (Customer #{req.customer_id})"

            greeting_ans = (
                f"Hello{cust_name}! I am your Banking Intelligence RAG Assistant{cid_info}.\n\n"
                f"You can ask me questions such as:\n"
                f"• 'What is my total working balance?'\n"
                f"• 'How many loan accounts do I have?'\n"
                f"• 'Is my KYC status complete or expired?'\n"
                f"• 'Do I have any overdue loan DPD?'\n"
                f"• 'What are the current home loan interest rates?'"
            )
            return FaqQueryResponse(
                status="MATCHED",
                query_type="BANKING_FAQ",
                user_question=q_raw,
                customer_id=req.customer_id,
                customer_name=cust_name.strip() if cust_name else None,
                answer=greeting_ans,
                matched_faq=None,
                confidence_score="HIGH",
                similarity_score=1.0,
                explanation="Assistant greeting and capabilities guide.",
                suggested_related_faqs=faqs[:3],
                citations=[],
                llm_provider="Ollama Assistant" if ollama_avail else "DuckDB-RAG Engine",
                ollama_available=ollama_avail,
                ollama_model=target_model if ollama_avail else None
            )

        # 3. CHECK CUSTOMER-SPECIFIC RAG INTENT
        extracted_id = req.customer_id
        match_id = re.search(r'\b100\d{3}\b', q_lower)
        if match_id:
            extracted_id = int(match_id.group(0))

        # Check if question is about customer profile data
        customer_keywords = [
            "balance", "working balance", "account", "accounts", "loan", "loans",
            "kyc", "status", "dpd", "overdue", "suspicious", "credit", "limit",
            "income", "user", "customer", "my", "how many", "number of", "details"
        ]
        
        is_customer_intent = (extracted_id is not None) and (
            any(trigger in q_lower for trigger in CUSTOMER_INTENT_TRIGGERS) or
            any(kw in q_lower for kw in customer_keywords)
        )

        if is_customer_intent and extracted_id:
            c360 = CustomerService.get_customer_360(extracted_id)
            kyc = KycService.evaluate_customer_kyc(extracted_id)

            if c360 and kyc:
                c = c360.customer
                ans_parts = [
                    f"Hello {c.name_1} (Customer #{c.customer_id}). Here is your real-time account and loan summary from our DuckDB core banking engine:"
                ]

                # Specific Loan Account Count & Breakdown
                if "loan" in q_lower or "loans" in q_lower or "dpd" in q_lower or "overdue" in q_lower or "emi" in q_lower:
                    loan_count = len(c360.loans)
                    if loan_count > 0:
                        ans_parts.append(f"• Active Loan Accounts Count: Customer #{c.customer_id} ({c.name_1}) has exactly {loan_count} active loan account(s).")
                        loan_details_list = []
                        for idx, ln in enumerate(c360.loans, 1):
                            loan_details_list.append(
                                f"  {idx}. {ln.product} LOAN (Loan ID #{ln.loan_id}): Outstanding ₹{ln.outstanding:,.2f} of Sanctioned ₹{ln.sanctioned_amount:,.2f} @ {ln.interest_rate}% p.a., Status: {ln.status} ({ln.days_past_due} Days DPD Overdue)"
                            )
                        ans_parts.append("\n".join(loan_details_list))
                        ans_parts.append(f"• Total Aggregated Outstanding Loan Balance: ₹{c360.total_outstanding_loan:,.2f} (Max Overdue: {c360.max_days_past_due} DPD).")
                    else:
                        ans_parts.append(f"• Active Loan Accounts Count: Customer #{c.customer_id} ({c.name_1}) has 0 active loan accounts.")

                # Account Balance Breakdown
                if "balance" in q_lower or "account" in q_lower or "accounts" in q_lower:
                    ans_parts.append(f"• Deposit & Savings Accounts Count: {len(c360.accounts)} active account(s).")
                    acc_list = []
                    for acc in c360.accounts:
                        acc_list.append(f"  - {acc.account_title} (Acc #{acc.account_id}, {acc.product}): Working Balance ₹{acc.working_balance:,.2f} ({acc.currency})")
                    ans_parts.append("\n".join(acc_list))
                    ans_parts.append(f"• Total Aggregated Working Balance: ₹{c360.total_working_balance:,.2f}.")

                # KYC Status Breakdown
                if "kyc" in q_lower or "status" in q_lower or "verified" in q_lower:
                    ans_parts.append(f"• Regulatory e-KYC Status: {kyc.overall_status} ({kyc.completeness_percentage}% Verified).")

                # Default Complete Context if generic
                if len(ans_parts) == 1:
                    ans_parts.append(f"• Total Active Loans: {len(c360.loans)} loan account(s) totaling ₹{c360.total_outstanding_loan:,.2f} outstanding.")
                    ans_parts.append(f"• Total Active Deposit Accounts: {len(c360.accounts)} account(s) totaling ₹{c360.total_working_balance:,.2f} working balance.")
                    ans_parts.append(f"• Regulatory KYC Status: {kyc.overall_status} ({kyc.completeness_percentage}% Verified).")

                deterministic_ans = "\n".join(ans_parts)

                rag_citations = [
                    CitationEvidence(
                        table="loans.csv",
                        record_id=str(c.customer_id),
                        field_name="loan_count",
                        value=str(len(c360.loans)),
                        description=f"Total active loan accounts count for {c.name_1}"
                    ),
                    CitationEvidence(
                        table="loans.csv",
                        record_id=str(c.customer_id),
                        field_name="outstanding",
                        value=f"₹{c360.total_outstanding_loan:,.2f}",
                        description="Total aggregated loan outstanding balance"
                    ),
                    CitationEvidence(
                        table="accounts.csv",
                        record_id=str(c.customer_id),
                        field_name="working_balance",
                        value=f"₹{c360.total_working_balance:,.2f}",
                        description="Total aggregated working balance"
                    )
                ]

                # Synthesize with Ollama if available
                final_ans = deterministic_ans
                provider = "DuckDB-RAG Engine"
                if ollama_avail:
                    ollama_gen = cls.generate_ollama_completion(q_raw, deterministic_ans, target_model)
                    if ollama_gen:
                        final_ans = ollama_gen
                        provider = f"Ollama Local LLM ({target_model})"

                return FaqQueryResponse(
                    status="MATCHED",
                    query_type="CUSTOMER_SPECIFIC",
                    user_question=q_raw,
                    customer_id=c.customer_id,
                    customer_name=c.name_1,
                    answer=final_ans,
                    matched_faq=None,
                    confidence_score="HIGH",
                    similarity_score=0.98,
                    explanation=f"Retrieved Customer 360 facts for {c.name_1} (ID #{c.customer_id}) from DuckDB; synthesized via {provider}.",
                    suggested_related_faqs=faqs[:2],
                    citations=rag_citations,
                    llm_provider=provider,
                    ollama_available=ollama_avail,
                    ollama_model=target_model if ollama_avail else None
                )

        # 4. GENERAL BANKING POLICY RAG SEARCH
        best_faq: Optional[FaqItem] = None
        highest_score = 0.0

        q_words = set(re.findall(r'\w+', q_lower))

        for faq in faqs:
            f_text = f"{faq.question} {faq.answer} {' '.join(faq.keywords)}".lower()
            f_words = set(re.findall(r'\w+', f_text))
            
            overlap = len(q_words.intersection(f_words))
            score = overlap / max(len(q_words), 1)

            for kw in faq.keywords:
                if kw.lower() in q_lower:
                    score += 0.25

            if score > highest_score:
                highest_score = score
                best_faq = faq

        if highest_score >= 0.10 and best_faq:
            confidence = "HIGH" if highest_score >= 0.35 else "MEDIUM"
            related = [f for f in faqs if f.id in best_faq.related_faqs or (f.category == best_faq.category and f.id != best_faq.id)]
            
            final_ans = best_faq.answer
            provider = "DuckDB Policy RAG"
            if ollama_avail:
                context_str = f"Official Bank Policy FAQ ({best_faq.category}): {best_faq.question}\nOfficial Answer: {best_faq.answer}"
                ollama_gen = cls.generate_ollama_completion(q_raw, context_str, target_model)
                if ollama_gen:
                    final_ans = ollama_gen
                    provider = f"Ollama Local LLM ({target_model})"

            return FaqQueryResponse(
                status="MATCHED",
                query_type="BANKING_FAQ",
                user_question=q_raw,
                customer_id=req.customer_id,
                answer=final_ans,
                matched_faq=best_faq,
                confidence_score=confidence,
                similarity_score=round(min(highest_score, 1.0), 3),
                explanation=f"Matched Banking Policy FAQ '{best_faq.question}' ({best_faq.category}) with {confidence} confidence.",
                suggested_related_faqs=related[:3],
                citations=[
                    CitationEvidence(
                        table="faqs.json",
                        record_id=best_faq.id,
                        field_name="question",
                        value=best_faq.question,
                        description=f"Matched Banking Knowledge Base record ({best_faq.category})"
                    )
                ],
                llm_provider=provider,
                ollama_available=ollama_avail,
                ollama_model=target_model if ollama_avail else None
            )

        # 5. REFUSAL FOR UNMATCHED OR UNCLEAR PROMPTS
        return FaqQueryResponse(
            status="REFUSED",
            query_type="REFUSED",
            user_question=q_raw,
            customer_id=req.customer_id,
            answer=None,
            confidence_score="REFUSED",
            similarity_score=round(highest_score, 3),
            explanation="The prompt could not be matched with high confidence to any verified banking policy or customer profile.",
            refusal_reason="I can only assist with verified banking policies (loans, credit cards, net banking) or your specific customer account 360 profile. Please rephrase your question or select a valid customer.",
            suggested_related_faqs=faqs[:3],
            citations=[],
            llm_provider="Refusal Guardrail",
            ollama_available=ollama_avail,
            ollama_model=target_model if ollama_avail else None
        )
