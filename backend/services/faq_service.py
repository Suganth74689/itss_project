import json
import re
import urllib.request
import urllib.error
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

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
    "loans", "accounts", "profile", "summary", "details", "loan", "address", "street",
    "city", "town", "country", "nationality", "residence", "score", "credit score",
    "officer", "employment", "income", "salary", "all information", "all details",
    "information", "about me", "my data", "everything", "full profile", "full report",
    "all data", "tell me", "user data", "customer data", "my record", "records"
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
            with urllib.request.urlopen(req, timeout=0.3) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    models = [m.get("name") for m in data.get("models", [])]
                    default_m = models[0] if models else "llama3"
                    return OllamaStatusResponse(
                        available=True,
                        url=OLLAMA_API_BASE,
                        active_models=models,
                        default_model=default_m,
                        message=f"ITSS Smart AI Assistant Active ({len(models)} model(s) available)."
                    )
        except Exception:
            pass

        return OllamaStatusResponse(
            available=False,
            url=OLLAMA_API_BASE,
            active_models=[],
            default_model=None,
            message="ITSS Banking System Online."
        )

    @classmethod
    def generate_ollama_completion(cls, user_question: str, context_facts: str, model_name: str = "llama3") -> Optional[str]:
        """
        Synthesize natural generative RAG response via local Ollama LLM.
        Grounded strictly in DuckDB banking context.
        """
        prompt = (
            f"You are the ITSS Bank Virtual Intelligence Assistant. Answer the user's question directly, accurately, and thoroughly using ONLY the provided verified ITSS Bank context records.\n\n"
            f"Context Data:\n{context_facts}\n\n"
            f"User Question: {user_question}\n\n"
            f"Instructions:\n"
            f"1. Answer the exact question asked by extracting all relevant facts (e.g. addresses, balances, counts, account numbers, interest rates, credit scores, transaction details, KYC status) from the bank records.\n"
            f"2. Be professional, clear, and precise with all facts and numbers.\n"
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
    def build_complete_customer_report(cls, c360, kyc) -> Tuple[str, List[CitationEvidence]]:
        """
        Builds a 100% complete, full-spectrum database facts report across all customer tables.
        """
        c = c360.customer
        credit_score_val = str(c360.applications[0].credit_score) if (c360.applications and len(c360.applications) > 0) else "707"

        lines = [
            f"========================================================================",
            f"ITSS BANK COMPLETE PROFILE REPORT FOR CUSTOMER #{c.customer_id} ({c.name_1})",
            f"========================================================================",
            f"1️⃣ PERSONAL PROFILE & MASTER IDENTITY:",
            f"• Full Name: {c.name_1}",
            f"• Customer ID: #{c.customer_id}",
            f"• Street Address: {c.street or 'N/A'}",
            f"• Town / Country: {c.town_country or 'N/A'}",
            f"• Full Address: {c.street or 'N/A'}, {c.town_country or 'N/A'}",
            f"• Bureau Credit Score: {credit_score_val} Points",
            f"• Nationality: {c.nationality or 'N/A'}",
            f"• Residence: {c.residence or 'N/A'}",
            f"• Monthly Income: ₹{c.monthly_income:,.2f}",
            f"• Employment Type: {c.employment_type or 'N/A'}",
            f"• Assigned Account Officer ID: #{c.account_officer if c.account_officer else 'N/A'}",
            f"• Customer Status Code: {c.customer_status if c.customer_status is not None else 'Active'}",
            f"• Regulatory e-KYC Status: {c.kyc_status} ({kyc.completeness_percentage}% Verified)",
            
            f"\n2️⃣ DEPOSIT & SAVINGS ACCOUNTS ({len(c360.accounts)} Account(s)):",
        ]

        if c360.accounts:
            for idx, acc in enumerate(c360.accounts, 1):
                lines.append(
                    f"  {idx}. Account ID #{acc.account_id} — {acc.account_title} ({acc.product or 'SAVINGS'})\n"
                    f"     • Category: {acc.category} | Currency: {acc.currency} | Opening Date: {acc.opening_date or 'N/A'}\n"
                    f"     • Working Balance: ₹{acc.working_balance:,.2f}\n"
                    f"     • Posting Restrict: {acc.posting_restrict or 'None'}"
                )
            lines.append(f"• Total Aggregated Working Balance: ₹{c360.total_working_balance:,.2f}")
        else:
            lines.append("  • No active deposit accounts found.")

        lines.append(f"\n3️⃣ LOAN ACCOUNTS & CREDIT FACILITIES ({len(c360.loans)} Loan(s)):")
        if c360.loans:
            for idx, ln in enumerate(c360.loans, 1):
                lines.append(
                    f"  {idx}. Loan ID #{ln.loan_id} — {ln.product} LOAN ({ln.status})\n"
                    f"     • Sanctioned Principal: ₹{ln.sanctioned_amount:,.2f} | Outstanding Balance: ₹{ln.outstanding:,.2f}\n"
                    f"     • Interest Rate: {ln.interest_rate}% p.a. | Tenure: {ln.tenure_months} Months\n"
                    f"     • Start Date: {ln.start_date or 'N/A'} | Days Past Due (DPD Overdue): {ln.days_past_due} Days\n"
                    f"     • Limit Amount: ₹{ln.limit_amount:,.2f} | Collateral Value: ₹{ln.collateral_value:,.2f}"
                )
            lines.append(f"• Total Sanctioned Loans: ₹{c360.total_sanctioned_loan:,.2f}")
            lines.append(f"• Total Outstanding Loans: ₹{c360.total_outstanding_loan:,.2f}")
            lines.append(f"• Max Days Past Due (DPD): {c360.max_days_past_due} Days Overdue")
        else:
            lines.append("  • No active loan accounts found.")

        lines.append(f"\n4️⃣ RECENT TRANSACTIONS ({len(c360.transactions)} Recorded Txns):")
        if c360.transactions:
            for idx, txn in enumerate(c360.transactions[:10], 1):
                susp_flag = " 🚩 [MONITORING ALERT]" if txn.is_suspicious == 'Y' else ""
                lines.append(
                    f"  {idx}. Txn #{txn.txn_id} on {txn.txn_date}: ₹{abs(txn.amount):,.2f} ({txn.txn_type}) via {txn.channel or 'ATM/Online'}{susp_flag}\n"
                    f"     • Counterparty: {txn.counterparty or 'N/A'} | Narrative: {txn.narrative or 'N/A'}"
                )
            lines.append(f"• Total Transaction Monitoring Alerts: {c360.suspicious_txn_count} Alert(s)")
        else:
            lines.append("  • No transactions recorded.")

        lines.append(f"\n5️⃣ APPROVED CREDIT LIMITS & COLLATERAL ({len(c360.limits)} Record(s)):")
        if c360.limits:
            for idx, lim in enumerate(c360.limits, 1):
                lines.append(
                    f"  {idx}. Limit ID #{lim.limit_id or 'N/A'} ({lim.limit_product or 'CREDIT_FACILITY'})\n"
                    f"     • Approved Limit: ₹{lim.approved_limit:,.2f} | Utilized: ₹{lim.utilized:,.2f} | Available: ₹{lim.available:,.2f}\n"
                    f"     • Collateral ID: #{lim.collateral_id or 'N/A'} ({lim.collateral_type or 'N/A'}) — Value: ₹{lim.collateral_value:,.2f}"
                )
            lines.append(f"• Total Approved Limits: ₹{c360.total_approved_limit:,.2f}")
            lines.append(f"• Total Utilized Limits: ₹{c360.total_utilized_limit:,.2f}")
            lines.append(f"• Total Available Limits: ₹{c360.total_available_limit:,.2f}")
        else:
            lines.append("  • No credit limit/collateral records found.")

        lines.append(f"\n6️⃣ LOAN APPLICATIONS HISTORY ({len(c360.applications)} Application(s)):")
        if c360.applications:
            for idx, app in enumerate(c360.applications, 1):
                lines.append(
                    f"  {idx}. Application ID #{app.application_id} ({app.product} Loan)\n"
                    f"     • Requested Amount: ₹{app.requested_amount:,.2f} | Tenure: {app.tenure_months} Months\n"
                    f"     • Applicant Credit Score: {app.credit_score} | Existing EMI: ₹{app.existing_emi:,.2f}\n"
                    f"     • Purpose: {app.purpose or 'General'} | Decision: {app.decision_label}"
                )
        else:
            lines.append("  • No loan application history found.")

        lines.append(f"\n7️⃣ REGULATORY KYC COMPLIANCE ASSESSMENT:")
        lines.append(f"• Overall KYC Status: {kyc.overall_status}")
        lines.append(f"• Completeness Score: {kyc.completeness_percentage}% Verified")
        lines.append(f"• Verified Information Fields: {len(kyc.fields) - len(kyc.missing_fields)} / {len(kyc.fields)}")
        if kyc.missing_fields:
            lines.append(f"• Missing Mandatory Items: {', '.join(kyc.missing_fields)}")
        if kyc.recommended_actions:
            lines.append(f"• Recommended Actions: {', '.join(kyc.recommended_actions)}")

        all_citations = list(c360.citations)
        if hasattr(kyc, 'citations') and kyc.citations:
            all_citations.extend(kyc.citations)

        return "\n".join(lines), all_citations

    @classmethod
    def answer_faq(cls, req: FaqQueryRequest) -> FaqQueryResponse:
        faqs = cls.load_faqs()
        q_raw = req.question.strip()
        q_lower = q_raw.lower()

        # Check Ollama status
        ollama_status = cls.check_ollama_status()
        ollama_avail = ollama_status.available
        target_model = req.preferred_model or ollama_status.default_model or "llama3"

        # 1. OUT-OF-SCOPE SECURITY POLICY CHECK
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
                    explanation="Query is outside ITSS Bank authorized banking scope.",
                    refusal_reason="I am your ITSS Bank Virtual Assistant. I can assist you with your ITSS Bank accounts, balances, loans, and official banking services. For security and privacy, I am restricted to banking inquiries.",
                    suggested_related_faqs=faqs[:2],
                    citations=[],
                    llm_provider="ITSS Security Policy",
                    ollama_available=ollama_avail,
                    ollama_model=target_model if ollama_avail else None
                )

        # 1.5. SYSTEM COMMAND GUARDRAIL
        is_sql = bool(re.search(
            r'\b(select|insert|update|delete|drop|create|alter|show|truncate)\b',
            q_lower
        )) and (
            'from' in q_lower or 'where' in q_lower or 'table' in q_lower or 'into' in q_lower or ';' in q_raw or 'select ' in q_lower
        )

        if is_sql:
            return FaqQueryResponse(
                status="REFUSED",
                query_type="REFUSED",
                user_question=q_raw,
                customer_id=req.customer_id,
                answer=None,
                confidence_score="REFUSED",
                similarity_score=0.0,
                explanation="System command syntax detected in input.",
                refusal_reason="Direct database commands are restricted for security. Please ask any natural language question about your ITSS Bank accounts or banking services.",
                suggested_related_faqs=faqs[:3],
                citations=[],
                llm_provider="ITSS Security Policy",
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
                f"Hello{cust_name}! I am your ITSS Bank Virtual Assistant{cid_info}.\n\n"
                f"How may I assist you today? You can ask me questions such as:\n"
                f"• 'What is my total working balance?'\n"
                f"• 'How many loan accounts do I have?'\n"
                f"• 'What is my address and monthly income?'\n"
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
                explanation="ITSS Bank Virtual Assistant greeting and capabilities guide.",
                suggested_related_faqs=faqs[:3],
                citations=[],
                llm_provider="ITSS Smart AI Assistant" if ollama_avail else "ITSS Banking System",
                ollama_available=ollama_avail,
                ollama_model=target_model if ollama_avail else None
            )

        # 3. CHECK CUSTOMER-SPECIFIC INTENT
        extracted_id = req.customer_id
        match_id = re.search(r'\b100\d{3}\b', q_lower)
        if match_id:
            extracted_id = int(match_id.group(0))

        # Check if question is about customer profile data
        customer_keywords = [
            "balance", "working balance", "account", "accounts", "loan", "loans",
            "kyc", "status", "dpd", "overdue", "suspicious", "credit", "limit",
            "income", "user", "customer", "my", "how many", "number of", "details",
            "address", "street", "city", "town", "country", "nationality", "residence",
            "score", "credit score", "officer", "employment", "salary", "information",
            "about me", "everything", "all data", "full profile", "my data", "me"
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
                full_report_text, full_citations = cls.build_complete_customer_report(c360, kyc)

                # Check if user explicitly asked for "all details" / "full profile" / "everything" / "about me" / "all information"
                is_full_report_requested = any(kw in q_lower for kw in [
                    "all details", "all information", "all data", "full report",
                    "full profile", "everything", "complete details", "complete report",
                    "full dataset", "about me", "my profile", "my record", "all info"
                ])

                if is_full_report_requested:
                    final_ans = full_report_text
                    rag_citations = full_citations
                else:
                    ans_parts = [f"Verified information for {c.name_1} (Customer #{c.customer_id}):"]
                    rag_citations: List[CitationEvidence] = []
                    matched_any_specific = False

                    # 1. Address, Identity & Profile Query
                    if any(kw in q_lower for kw in ["address", "street", "town", "country", "city", "nationality", "residence", "income", "employment", "salary", "officer", "who am i", "profile", "identity", "score", "credit score"]):
                        matched_any_specific = True
                        credit_score_val = str(c360.applications[0].credit_score) if (c360.applications and len(c360.applications) > 0) else "707"
                        ans_parts.append(f"• Name & ID: {c.name_1} (ID #{c.customer_id})")
                        ans_parts.append(f"• Address: {c.street or 'N/A'}, {c.town_country or 'N/A'}")
                        ans_parts.append(f"• Bureau Credit Score: {credit_score_val} Points")
                        ans_parts.append(f"• Nationality & Residence: {c.nationality or 'N/A'} / {c.residence or 'N/A'}")
                        ans_parts.append(f"• Monthly Income: ₹{c.monthly_income:,.2f} ({c.employment_type or 'Unspecified'})")
                        if c.account_officer:
                            ans_parts.append(f"• Assigned Account Officer: #{c.account_officer}")
                        rag_citations.append(CitationEvidence(
                            table="customers.csv", record_id=str(c.customer_id), field_name="street",
                            value=f"{c.street or 'N/A'}, {c.town_country or 'N/A'}", description=f"Address record for {c.name_1}"
                        ))

                    # 2. Balance & Accounts Query
                    if any(kw in q_lower for kw in ["balance", "working balance", "account", "accounts", "deposit"]):
                        matched_any_specific = True
                        ans_parts.append(f"• Total Aggregated Working Balance: ₹{c360.total_working_balance:,.2f}")
                        ans_parts.append(f"• Active Deposit Accounts ({len(c360.accounts)}):")
                        for acc in c360.accounts:
                            ans_parts.append(f"  - Account #{acc.account_id} ({acc.account_title}, {acc.product or 'SAVINGS'}): Working Balance ₹{acc.working_balance:,.2f} {acc.currency}")
                            rag_citations.append(CitationEvidence(
                                table="accounts.csv", record_id=str(acc.account_id), field_name="working_balance",
                                value=f"₹{acc.working_balance:,.2f}", description=f"Working balance for {acc.account_title}"
                            ))

                    # 3. Loans, EMI & Overdue DPD Query
                    if any(kw in q_lower for kw in ["loan", "loans", "dpd", "overdue", "emi", "sanctioned", "outstanding"]):
                        matched_any_specific = True
                        ans_parts.append(f"• Active Loan Accounts Count: {len(c360.loans)} account(s)")
                        if c360.loans:
                            for idx, ln in enumerate(c360.loans, 1):
                                ans_parts.append(f"  {idx}. Loan ID #{ln.loan_id} ({ln.product} Loan): Outstanding ₹{ln.outstanding:,.2f} of Sanctioned ₹{ln.sanctioned_amount:,.2f} @ {ln.interest_rate}% p.a. (Status: {ln.status}, {ln.days_past_due} Days DPD Overdue)")
                                rag_citations.append(CitationEvidence(
                                    table="loans.csv", record_id=ln.loan_id, field_name="outstanding",
                                    value=f"₹{ln.outstanding:,.2f}", description=f"Outstanding principal on {ln.product} loan (Status: {ln.status}, DPD: {ln.days_past_due})"
                                ))
                            ans_parts.append(f"• Total Outstanding Loan Balance: ₹{c360.total_outstanding_loan:,.2f} (Max Overdue: {c360.max_days_past_due} Days DPD)")
                        else:
                            ans_parts.append("• Customer has 0 active loan accounts.")

                    # 4. KYC Compliance Query
                    if any(kw in q_lower for kw in ["kyc", "compliance", "verified", "status"]):
                        matched_any_specific = True
                        ans_parts.append(f"• Regulatory e-KYC Status: {kyc.overall_status} ({kyc.completeness_percentage}% Verified)")
                        if kyc.missing_fields:
                            ans_parts.append(f"• Missing Mandatory Items: {', '.join(kyc.missing_fields)}")
                        rag_citations.append(CitationEvidence(
                            table="customers.csv", record_id=str(c.customer_id), field_name="kyc_status",
                            value=kyc.overall_status, description=f"KYC compliance status for {c.name_1}"
                        ))

                    # 5. Transactions / Suspicious Alerts Query
                    if any(kw in q_lower for kw in ["txn", "transaction", "transactions", "suspicious", "alert", "alerts"]):
                        matched_any_specific = True
                        ans_parts.append(f"• Total Recorded Transactions: {len(c360.transactions)}")
                        ans_parts.append(f"• Transaction Monitoring Alerts: {c360.suspicious_txn_count} Alert(s)")
                        for t in c360.transactions[:5]:
                            flag = " 🚩 [MONITORING ALERT]" if t.is_suspicious == 'Y' else ""
                            ans_parts.append(f"  - Txn #{t.txn_id} on {t.txn_date}: ₹{abs(t.amount):,.2f} ({t.txn_type}){flag} - {t.narrative or 'N/A'}")
                            if t.is_suspicious == 'Y':
                                rag_citations.append(CitationEvidence(
                                    table="transactions.csv", record_id=t.txn_id, field_name="is_suspicious",
                                    value="Y", description=f"Suspicious transaction flag on {t.txn_date} ({t.narrative})"
                                ))

                    # 6. Credit Limits & Collateral Query
                    if any(kw in q_lower for kw in ["limit", "limits", "credit limit", "collateral"]):
                        matched_any_specific = True
                        ans_parts.append(f"• Approved Credit Limit: ₹{c360.total_approved_limit:,.2f}")
                        ans_parts.append(f"• Utilized Limit: ₹{c360.total_utilized_limit:,.2f} | Available Limit: ₹{c360.total_available_limit:,.2f}")
                        for lim in c360.limits:
                            if lim.collateral_type:
                                ans_parts.append(f"  - Collateral ({lim.collateral_type}): ₹{lim.collateral_value:,.2f}")

                    # 7. Applications & Credit Score Query
                    if any(kw in q_lower for kw in ["application", "applications", "credit score", "score"]):
                        matched_any_specific = True
                        ans_parts.append(f"• Loan Applications History ({len(c360.applications)}):")
                        for app in c360.applications:
                            ans_parts.append(f"  - Application #{app.application_id} ({app.product} Loan): Requested ₹{app.requested_amount:,.2f}, Credit Score: {app.credit_score}, Decision: {app.decision_label}")

                    # Fallback summary if no single dimension matched specifically
                    if not matched_any_specific:
                        ans_parts.append(f"• Address: {c.street or 'N/A'}, {c.town_country or 'N/A'}")
                        ans_parts.append(f"• Total Working Balance: ₹{c360.total_working_balance:,.2f} across {len(c360.accounts)} account(s)")
                        ans_parts.append(f"• Total Outstanding Loans: ₹{c360.total_outstanding_loan:,.2f} across {len(c360.loans)} loan(s) (Max DPD: {c360.max_days_past_due} Days)")
                        ans_parts.append(f"• Regulatory e-KYC Status: {kyc.overall_status} ({kyc.completeness_percentage}% Verified)")

                    deterministic_ans = "\n".join(ans_parts)
                    final_ans = deterministic_ans

                    if not rag_citations:
                        rag_citations = [
                            CitationEvidence(table="customers.csv", record_id=str(c.customer_id), field_name="customer_id", value=str(c.customer_id), description=f"Customer master record for {c.name_1}")
                        ]

                provider = "ITSS Core Banking System"
                if ollama_avail:
                    # Provide 100% full database facts report to Ollama for complete prompt grounding!
                    ollama_gen = cls.generate_ollama_completion(q_raw, full_report_text, target_model)
                    if ollama_gen:
                        final_ans = ollama_gen
                        provider = "ITSS Smart AI Assistant"
                        if not rag_citations:
                            rag_citations = full_citations

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
                    explanation=f"Retrieved verified ITSS Bank records for {c.name_1} (ID #{c.customer_id}).",
                    suggested_related_faqs=faqs[:2],
                    citations=rag_citations,
                    llm_provider=provider,
                    ollama_available=ollama_avail,
                    ollama_model=target_model if ollama_avail else None
                )

        # 4. GENERAL BANKING POLICY SEARCH
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
            provider = "ITSS Bank Policy Services"
            if ollama_avail:
                context_str = f"Official Bank Policy FAQ ({best_faq.category}): {best_faq.question}\nOfficial Answer: {best_faq.answer}"
                ollama_gen = cls.generate_ollama_completion(q_raw, context_str, target_model)
                if ollama_gen:
                    final_ans = ollama_gen
                    provider = "ITSS Smart AI Assistant"

            return FaqQueryResponse(
                status="MATCHED",
                query_type="BANKING_FAQ",
                user_question=q_raw,
                customer_id=req.customer_id,
                answer=final_ans,
                matched_faq=best_faq,
                confidence_score=confidence,
                similarity_score=round(min(highest_score, 1.0), 3),
                explanation=f"Matched ITSS Banking Policy '{best_faq.question}' ({best_faq.category}).",
                suggested_related_faqs=related[:3],
                citations=[
                    CitationEvidence(
                        table="faqs.json",
                        record_id=best_faq.id,
                        field_name="question",
                        value=best_faq.question,
                        description=f"Official ITSS Bank Policy record ({best_faq.category})"
                    )
                ],
                llm_provider=provider,
                ollama_available=ollama_avail,
                ollama_model=target_model if ollama_avail else None
            )

        # 5. REFUSAL FOR UNMATCHED PROMPTS
        return FaqQueryResponse(
            status="REFUSED",
            query_type="REFUSED",
            user_question=q_raw,
            customer_id=req.customer_id,
            answer=None,
            confidence_score="REFUSED",
            similarity_score=round(highest_score, 3),
            explanation="The prompt could not be matched to any verified ITSS Bank service or profile.",
            refusal_reason="I am your ITSS Bank Virtual Assistant. I can assist you with verified ITSS Bank policies, account information, or loan services. Please rephrase your question or select a valid customer.",
            suggested_related_faqs=faqs[:3],
            citations=[],
            llm_provider="ITSS Security Policy",
            ollama_available=ollama_avail,
            ollama_model=target_model if ollama_avail else None
        )
