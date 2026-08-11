import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

from schemas import (
    FaqItem, FaqQueryRequest, FaqQueryResponse, CitationEvidence
)
from services.customer_service import CustomerService
from services.kyc_service import KycService

BASE_DIR = Path(__file__).resolve().parent.parent
FAQS_PATH = BASE_DIR / "data" / "faqs.json"

NON_BANKING_TRIGGERS = [
    "prime minister", "president", "python", "java", "c++", "script",
    "cricket", "football", "ipl", "match", "movie", "cinema", "recipe",
    "weather", "temperature", "tell me a joke", "song", "who won", "capital of"
]

CUSTOMER_INTENT_TRIGGERS = [
    "my balance", "working balance", "my account", "my loan", "my kyc",
    "kyc status", "overdue", "dpd", "suspicious", "my credit score",
    "my income", "my profile", "my limit", "my emi", "my details",
    "who am i", "my status", "account balance", "loan details"
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
    def answer_faq(cls, req: FaqQueryRequest) -> FaqQueryResponse:
        faqs = cls.load_faqs()
        q_raw = req.question.strip()
        q_lower = q_raw.lower()

        # 1. STRICT OUT-OF-SCOPE GUARDRAIL CHECK
        for trigger in NON_BANKING_TRIGGERS:
            if trigger in q_lower:
                return FaqQueryResponse(
                    status="REFUSED",
                    query_type="REFUSED",
                    user_question=q_raw,
                    customer_id=req.customer_id,
                    confidence_score="REFUSED",
                    similarity_score=0.0,
                    explanation=f"Out-of-scope query detected matching prohibited trigger '{trigger}'.",
                    refusal_reason="This assistant is strictly restricted to banking policies, customer account 360 data, KYC compliance, and loan inquiries. Non-banking topics (sports, entertainment, coding, politics) are strictly prohibited.",
                    suggested_related_faqs=faqs[:2],
                    citations=[]
                )

        # 2. CHECK CUSTOMER-SPECIFIC RAG INTENT
        # Extract explicit customer ID from prompt if mentioned (e.g. "for 100106" or "customer 100100")
        extracted_id = req.customer_id
        match_id = re.search(r'\b100\d{3}\b', q_lower)
        if match_id:
            extracted_id = int(match_id.group(0))

        is_customer_intent = any(trigger in q_lower for trigger in CUSTOMER_INTENT_TRIGGERS) or (extracted_id is not None and ("details" in q_lower or "summary" in q_lower or "info" in q_lower))

        if is_customer_intent and extracted_id:
            c360 = CustomerService.get_customer_360(extracted_id)
            kyc = KycService.evaluate_customer_kyc(extracted_id)

            if c360 and kyc:
                # Build Contextual Natural Language Answer from DuckDB RAG facts
                c = c360.customer
                ans_parts = [
                    f"Hello {c.name_1} (Customer #{c.customer_id}). Here is your real-time account summary from our DuckDB core banking engine:"
                ]

                if "balance" in q_lower or "account" in q_lower:
                    ans_parts.append(f"• Total Working Balance: ₹{c360.total_working_balance:,.2f} across {len(c360.accounts)} active account(s).")
                
                if "loan" in q_lower or "dpd" in q_lower or "overdue" in q_lower:
                    if len(c360.loans) > 0:
                        ans_parts.append(f"• Loans & Exposure: ₹{c360.total_outstanding_loan:,.2f} outstanding principal across {len(c360.loans)} loan(s). Max DPD: {c360.max_days_past_due} Days Overdue.")
                    else:
                        ans_parts.append("• Loans & Exposure: No active loan contracts found on your profile.")

                if "kyc" in q_lower or "status" in q_lower:
                    ans_parts.append(f"• Regulatory KYC Status: {kyc.overall_status} ({kyc.completeness_percentage}% Verified).")

                if "suspicious" in q_lower or "alert" in q_lower or "transaction" in q_lower:
                    ans_parts.append(f"• Transaction Monitoring: {c360.suspicious_txn_count} suspicious transaction alert(s) flagged.")

                if "limit" in q_lower or "credit" in q_lower:
                    ans_parts.append(f"• Credit Limits: ₹{c360.total_approved_limit:,.2f} approved limit (Available: ₹{c360.total_available_limit:,.2f}).")

                # Default general profile summary if generic query
                if len(ans_parts) == 1:
                    ans_parts.append(f"• Working Balance: ₹{c360.total_working_balance:,.2f}")
                    ans_parts.append(f"• KYC Status: {kyc.overall_status} ({kyc.completeness_percentage}% Verified)")
                    ans_parts.append(f"• Outstanding Loans: ₹{c360.total_outstanding_loan:,.2f} (Max DPD: {c360.max_days_past_due} Days)")
                    ans_parts.append(f"• Monthly Income: ₹{c.monthly_income:,.2f} ({c.employment_type})")

                customer_answer = "\n".join(ans_parts)

                # Deterministic field citations for Evidence Drawer
                rag_citations = [
                    CitationEvidence(
                        table="customers.csv",
                        record_id=str(c.customer_id),
                        field_name="kyc_status",
                        value=kyc.overall_status,
                        description=f"Regulatory KYC Status for {c.name_1}"
                    ),
                    CitationEvidence(
                        table="customers.csv",
                        record_id=str(c.customer_id),
                        field_name="monthly_income",
                        value=f"₹{c.monthly_income:,.2f}",
                        description="Declared monthly income"
                    ),
                    CitationEvidence(
                        table="accounts.csv",
                        record_id=str(c.customer_id),
                        field_name="working_balance",
                        value=f"₹{c360.total_working_balance:,.2f}",
                        description=f"Total aggregated working balance"
                    )
                ]

                return FaqQueryResponse(
                    status="MATCHED",
                    query_type="CUSTOMER_SPECIFIC",
                    user_question=q_raw,
                    customer_id=c.customer_id,
                    customer_name=c.name_1,
                    answer=customer_answer,
                    matched_faq=None,
                    confidence_score="HIGH",
                    similarity_score=0.98,
                    explanation=f"Customer 360 RAG Pipeline successfully retrieved live account facts for {c.name_1} (ID #{c.customer_id}) from DuckDB.",
                    suggested_related_faqs=faqs[:2],
                    citations=rag_citations
                )

        # 3. GENERAL BANKING POLICY RAG SEARCH
        best_faq: Optional[FaqItem] = None
        highest_score = 0.0

        q_words = set(re.findall(r'\w+', q_lower))

        for faq in faqs:
            f_text = f"{faq.question} {faq.answer} {' '.join(faq.keywords)}".lower()
            f_words = set(re.findall(r'\w+', f_text))
            
            overlap = len(q_words.intersection(f_words))
            score = overlap / max(len(q_words), 1)

            # Keyword boost
            for kw in faq.keywords:
                if kw.lower() in q_lower:
                    score += 0.25

            if score > highest_score:
                highest_score = score
                best_faq = faq

        # Confidence Threshold
        if highest_score >= 0.18 and best_faq:
            confidence = "HIGH" if highest_score >= 0.45 else "MEDIUM"
            related = [f for f in faqs if f.id in best_faq.related_faqs or (f.category == best_faq.category and f.id != best_faq.id)]
            
            return FaqQueryResponse(
                status="MATCHED",
                query_type="BANKING_FAQ",
                user_question=q_raw,
                customer_id=req.customer_id,
                answer=best_faq.answer,
                matched_faq=best_faq,
                confidence_score=confidence,
                similarity_score=round(min(highest_score, 1.0), 3),
                explanation=f"Matched Banking Policy FAQ '{best_faq.question}' under category '{best_faq.category}' with {confidence} confidence.",
                suggested_related_faqs=related[:3],
                citations=[
                    CitationEvidence(
                        table="faqs.json",
                        record_id=best_faq.id,
                        field_name="question",
                        value=best_faq.question,
                        description=f"Matched Banking Knowledge Base record ({best_faq.category})"
                    )
                ]
            )

        # 4. REFUSAL FOR UNMATCHED OR UNCLEAR PROMPTS
        return FaqQueryResponse(
            status="REFUSED",
            query_type="REFUSED",
            user_question=q_raw,
            customer_id=req.customer_id,
            confidence_score="REFUSED",
            similarity_score=round(highest_score, 3),
            explanation="The prompt could not be matched with high confidence to any verified banking policy or customer profile.",
            refusal_reason="I can only assist with verified banking policies (loans, credit cards, net banking) or your specific customer account 360 profile. Please rephrase your question or select a valid customer.",
            suggested_related_faqs=faqs[:3],
            citations=[]
        )
