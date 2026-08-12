export interface CitationEvidence {
  table: string;
  record_id: string;
  field_name: string;
  value: any;
  description?: string;
}

export interface CustomerProfile {
  customer_id: number;
  mnemonic?: string;
  short_name?: string;
  name_1: string;
  street?: string;
  town_country?: string;
  nationality?: string;
  residence?: string;
  sector?: number;
  account_officer?: number;
  date_of_birth?: string;
  customer_status?: number;
  kyc_status: string;
  monthly_income: number;
  employment_type?: string;
}

export interface AccountItem {
  account_id: number;
  customer_id: number;
  category: number;
  currency: string;
  account_title: string;
  opening_date?: string;
  working_balance: number;
  posting_restrict?: string;
  product?: string;
}

export interface LoanItem {
  loan_id: string;
  customer_id: number;
  product: string;
  currency: string;
  sanctioned_amount: number;
  outstanding: number;
  interest_rate: number;
  tenure_months: number;
  start_date?: string;
  status: string;
  days_past_due: number;
  collateral_value: number;
  limit_amount: number;
}

export interface TransactionItem {
  txn_id: string;
  account_id: number;
  customer_id: number;
  txn_date: string;
  value_date?: string;
  amount: number;
  txn_type: string;
  counterparty?: string;
  narrative?: string;
  channel?: string;
  is_suspicious: string;
}

export interface LoanApplicationItem {
  application_id: string;
  customer_id: number;
  product: string;
  requested_amount: number;
  tenure_months: number;
  existing_emi: number;
  credit_score: number;
  purpose?: string;
  decision_label: string;
}

export interface LimitCollateralItem {
  customer_id: number;
  limit_id?: string;
  limit_product?: string;
  currency?: string;
  approved_limit: number;
  utilized: number;
  available: number;
  collateral_id?: string;
  collateral_type?: string;
  collateral_value: number;
}

export interface Customer360Response {
  customer: CustomerProfile;
  accounts: AccountItem[];
  loans: LoanItem[];
  transactions: TransactionItem[];
  applications: LoanApplicationItem[];
  limits: LimitCollateralItem[];
  
  total_working_balance: number;
  total_sanctioned_loan: number;
  total_outstanding_loan: number;
  max_days_past_due: number;
  total_approved_limit: number;
  total_utilized_limit: number;
  total_available_limit: number;
  suspicious_txn_count: number;
  
  citations: CitationEvidence[];
}

export interface CustomerBasicInfo {
  customer_id: number;
  name_1: string;
  kyc_status: string;
  monthly_income: number;
  employment_type?: string;
}

// --- B2 KYC TYPES ---

export interface KycFieldItem {
  category_key: string;
  field_name: string;
  label: string;
  value: any;
  is_verified: boolean;
  documents_required: string[];
}

export interface KycCategorySummary {
  category_key: string;
  title: string;
  total_fields: number;
  verified_fields: number;
  is_complete: boolean;
}

export interface KycAssessmentResponse {
  customer_id: number;
  name_1: string;
  overall_status: string;
  completeness_percentage: number;
  categories: KycCategorySummary[];
  fields: KycFieldItem[];
  missing_fields: string[];
  recommended_actions: string[];
  documents_checklist: string[];
  citations: CitationEvidence[];
}

export interface KycVerifyDocumentRequest {
  document_type: string;
  document_number: string;
  notes?: string;
}

export interface KycVerifyDocumentResponse {
  success: boolean;
  message: string;
  updated_assessment: KycAssessmentResponse;
}

// --- B3 FAQ & RAG CHAT TYPES ---

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  related_faqs: string[];
}

export interface FaqQueryRequest {
  question: string;
  customer_id?: number;
  preferred_model?: string;
}

export interface FaqQueryResponse {
  status: string;
  query_type?: string;
  user_question: string;
  customer_id?: number;
  customer_name?: string;
  answer?: string;
  matched_faq?: FaqItem;
  confidence_score: string;
  similarity_score: number;
  explanation: string;
  refusal_reason?: string;
  suggested_related_faqs: FaqItem[];
  citations: CitationEvidence[];
  
  llm_provider?: string;
  ollama_available?: boolean;
  ollama_model?: string;
}

export interface OllamaStatusResponse {
  available: boolean;
  url: string;
  active_models: string[];
  default_model?: string;
  message: string;
}

// --- B4 LOOKALIKE TYPES ---

export interface LookalikeMatchItem {
  customer_id: number;
  name_1: string;
  similarity_score: number;
  similarity_pct: number;
  kyc_status: string;
  monthly_income: number;
  employment_type?: string;
  total_working_balance: number;
  total_outstanding_loan: number;
  max_days_past_due: number;
  credit_score: number;
  suspicious_txn_count: number;
  matching_features: string[];
  risk_discrepancies: string[];
  citations: CitationEvidence[];
}

export interface LookalikeResponse {
  target_customer_id: number;
  target_customer_name: string;
  lookalikes: LookalikeMatchItem[];
  citations: CitationEvidence[];
}

// --- AUTHENTICATION TYPES ---

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  avatar_url?: string;
  last_login?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  role?: string;
  remember_me?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

