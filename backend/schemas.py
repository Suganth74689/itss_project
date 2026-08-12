from typing import List, Optional, Any, Dict
from pydantic import BaseModel

class CitationEvidence(BaseModel):
    table: str
    record_id: str
    field_name: str
    value: Any
    description: Optional[str] = None

class CustomerProfile(BaseModel):
    customer_id: int
    mnemonic: Optional[str] = None
    short_name: Optional[str] = None
    name_1: str
    street: Optional[str] = None
    town_country: Optional[str] = None
    nationality: Optional[str] = None
    residence: Optional[str] = None
    sector: Optional[int] = None
    account_officer: Optional[int] = None
    date_of_birth: Optional[str] = None
    customer_status: Optional[int] = None
    kyc_status: str
    monthly_income: float
    employment_type: Optional[str] = None

class AccountItem(BaseModel):
    account_id: int
    customer_id: int
    category: int
    currency: str
    account_title: str
    opening_date: Optional[str] = None
    working_balance: float
    posting_restrict: Optional[str] = None
    product: Optional[str] = None

class LoanItem(BaseModel):
    loan_id: str
    customer_id: int
    product: str
    currency: str
    sanctioned_amount: float
    outstanding: float
    interest_rate: float
    tenure_months: int
    start_date: Optional[str] = None
    status: str
    days_past_due: int
    collateral_value: float
    limit_amount: float

class TransactionItem(BaseModel):
    txn_id: str
    account_id: int
    customer_id: int
    txn_date: str
    value_date: Optional[str] = None
    amount: float
    txn_type: str
    counterparty: Optional[str] = None
    narrative: Optional[str] = None
    channel: Optional[str] = None
    is_suspicious: str  # Y / N

class LoanApplicationItem(BaseModel):
    application_id: str
    customer_id: int
    product: str
    requested_amount: float
    tenure_months: int
    existing_emi: float
    credit_score: int
    purpose: Optional[str] = None
    decision_label: str  # APPROVE / REFER / REJECT

class LimitCollateralItem(BaseModel):
    customer_id: int
    limit_id: Optional[str] = None
    limit_product: Optional[str] = None
    currency: Optional[str] = None
    approved_limit: float
    utilized: float
    available: float
    collateral_id: Optional[str] = None
    collateral_type: Optional[str] = None
    collateral_value: float

class Customer360Response(BaseModel):
    customer: CustomerProfile
    accounts: List[AccountItem]
    loans: List[LoanItem]
    transactions: List[TransactionItem]
    applications: List[LoanApplicationItem]
    limits: List[LimitCollateralItem]
    
    total_working_balance: float
    total_sanctioned_loan: float
    total_outstanding_loan: float
    max_days_past_due: int
    total_approved_limit: float
    total_utilized_limit: float
    total_available_limit: float
    suspicious_txn_count: int
    
    citations: List[CitationEvidence]

class CustomerBasicInfo(BaseModel):
    customer_id: int
    name_1: str
    kyc_status: str
    monthly_income: float
    employment_type: Optional[str] = None

# --- B2 KYC SCHEMAS ---

class KycFieldItem(BaseModel):
    category_key: str
    field_name: str
    label: str
    value: Any
    is_verified: bool
    documents_required: List[str]

class KycCategorySummary(BaseModel):
    category_key: str
    title: str
    total_fields: int
    verified_fields: int
    is_complete: bool

class KycAssessmentResponse(BaseModel):
    customer_id: int
    name_1: str
    overall_status: str  # COMPLETE / PENDING / EXPIRED
    completeness_percentage: float
    categories: List[KycCategorySummary]
    fields: List[KycFieldItem]
    missing_fields: List[str]
    recommended_actions: List[str]
    documents_checklist: List[str]
    citations: List[CitationEvidence]

class KycVerifyDocumentRequest(BaseModel):
    document_type: str
    document_number: str
    notes: Optional[str] = None

class KycVerifyDocumentResponse(BaseModel):
    success: bool
    message: str
    updated_assessment: KycAssessmentResponse

# --- B3 FAQ & RAG CHAT SCHEMAS ---

class FaqItem(BaseModel):
    id: str
    category: str
    question: str
    answer: str
    keywords: List[str]
    related_faqs: List[str]

class FaqQueryRequest(BaseModel):
    question: str
    customer_id: Optional[int] = None
    preferred_model: Optional[str] = None  # e.g. "llama3", "mistral", "gemma", "tinyllama"

class FaqQueryResponse(BaseModel):
    status: str  # MATCHED / REFUSED
    query_type: Optional[str] = "BANKING_FAQ"  # CUSTOMER_SPECIFIC / BANKING_FAQ / REFUSED
    user_question: str
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    answer: Optional[str] = None
    matched_faq: Optional[FaqItem] = None
    confidence_score: str  # HIGH / MEDIUM / REFUSED
    similarity_score: float
    explanation: str
    refusal_reason: Optional[str] = None
    suggested_related_faqs: List[FaqItem] = []
    citations: List[CitationEvidence] = []
    
    llm_provider: Optional[str] = "DuckDB-RAG"  # "Ollama (llama3)" / "DuckDB-RAG"
    ollama_available: bool = False
    ollama_model: Optional[str] = None

class OllamaStatusResponse(BaseModel):
    available: bool
    url: str
    active_models: List[str]
    default_model: Optional[str] = None
    message: str

# --- B4 LOOKALIKE SCHEMAS ---

class LookalikeMatchItem(BaseModel):
    customer_id: int
    name_1: str
    similarity_score: float
    similarity_pct: float
    kyc_status: str
    monthly_income: float
    employment_type: Optional[str] = None
    total_working_balance: float
    total_outstanding_loan: float
    max_days_past_due: int
    credit_score: int
    suspicious_txn_count: int
    matching_features: List[str]
    risk_discrepancies: List[str]
    citations: List[CitationEvidence] = []

class LookalikeResponse(BaseModel):
    target_customer_id: int
    target_customer_name: str
    lookalikes: List[LookalikeMatchItem]
    citations: List[CitationEvidence] = []

# --- AUTHENTICATION SCHEMAS ---

class LoginRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = None
    remember_me: bool = True

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    department: str
    avatar_url: Optional[str] = None
    last_login: Optional[str] = None

class LoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    user: Optional[UserResponse] = None

