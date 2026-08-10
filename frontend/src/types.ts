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
