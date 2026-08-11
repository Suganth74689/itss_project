from typing import List, Optional, Dict, Any
from db import fetch_all_dict, fetch_one_dict
from schemas import (
    CustomerProfile, AccountItem, LoanItem, TransactionItem,
    LoanApplicationItem, LimitCollateralItem, Customer360Response,
    CitationEvidence, CustomerBasicInfo
)

def safe_float(val: Any, default: float = 0.0) -> float:
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return float(val)
    clean_str = str(val).replace('₹', '').replace('$', '').replace(',', '').strip()
    try:
        return float(clean_str)
    except (ValueError, TypeError):
        return default

def safe_int(val: Any, default: int = 0) -> int:
    if val is None:
        return default
    if isinstance(val, int):
        return val
    try:
        return int(float(str(val).replace(',', '').strip()))
    except (ValueError, TypeError):
        return default

class CustomerService:
    @staticmethod
    def list_customers(query: Optional[str] = None, limit: int = 50) -> List[CustomerBasicInfo]:
        sql = "SELECT customer_id, name_1, kyc_status, monthly_income, employment_type FROM customers"
        params = []
        
        if query and query.strip():
            sql += " WHERE CAST(customer_id AS VARCHAR) LIKE ? OR LOWER(name_1) LIKE ?"
            q_param = f"%{query.strip().lower()}%"
            params = [f"%{query.strip()}%", q_param]
            
        sql += " ORDER BY customer_id ASC LIMIT ?"
        params.append(limit)
        
        rows = fetch_all_dict(sql, params)
        result = []
        for r in rows:
            result.append(CustomerBasicInfo(
                customer_id=safe_int(r.get("customer_id")),
                name_1=str(r.get("name_1") or "Unknown"),
                kyc_status=str(r.get("kyc_status")) if r.get("kyc_status") else "UNKNOWN",
                monthly_income=safe_float(r.get("monthly_income")),
                employment_type=str(r.get("employment_type")) if r.get("employment_type") else None
            ))
        return result

    @staticmethod
    def get_customer_profile(customer_id: int) -> Optional[CustomerProfile]:
        row = fetch_one_dict(
            "SELECT customer_id, mnemonic, short_name, name_1, street, town_country, nationality, residence, sector, account_officer, date_of_birth, customer_status, kyc_status, monthly_income, employment_type FROM customers WHERE customer_id = ?",
            [customer_id]
        )
        
        if not row:
            return None
            
        return CustomerProfile(
            customer_id=safe_int(row.get("customer_id")),
            mnemonic=str(row.get("mnemonic")) if row.get("mnemonic") else None,
            short_name=str(row.get("short_name")) if row.get("short_name") else None,
            name_1=str(row.get("name_1") or "Unknown"),
            street=str(row.get("street")) if row.get("street") else None,
            town_country=str(row.get("town_country")) if row.get("town_country") else None,
            nationality=str(row.get("nationality")) if row.get("nationality") else None,
            residence=str(row.get("residence")) if row.get("residence") else None,
            sector=safe_int(row.get("sector")) if row.get("sector") is not None else None,
            account_officer=safe_int(row.get("account_officer")) if row.get("account_officer") is not None else None,
            date_of_birth=str(row.get("date_of_birth")) if row.get("date_of_birth") else None,
            customer_status=safe_int(row.get("customer_status")) if row.get("customer_status") is not None else None,
            kyc_status=str(row.get("kyc_status")) if row.get("kyc_status") else "UNKNOWN",
            monthly_income=safe_float(row.get("monthly_income")),
            employment_type=str(row.get("employment_type")) if row.get("employment_type") else None
        )

    @staticmethod
    def get_accounts(customer_id: int) -> List[AccountItem]:
        rows = fetch_all_dict(
            "SELECT account_id, customer_id, category, currency, account_title, opening_date, working_balance, posting_restrict, product FROM accounts WHERE customer_id = ? ORDER BY account_id",
            [customer_id]
        )
        
        return [
            AccountItem(
                account_id=safe_int(r.get("account_id")),
                customer_id=safe_int(r.get("customer_id")),
                category=safe_int(r.get("category")),
                currency=str(r.get("currency")) if r.get("currency") else "INR",
                account_title=str(r.get("account_title")) if r.get("account_title") else "",
                opening_date=str(r.get("opening_date")) if r.get("opening_date") else None,
                working_balance=safe_float(r.get("working_balance")),
                posting_restrict=str(r.get("posting_restrict")) if r.get("posting_restrict") else None,
                product=str(r.get("product")) if r.get("product") else None
            ) for r in rows
        ]

    @staticmethod
    def get_loans(customer_id: int) -> List[LoanItem]:
        rows = fetch_all_dict(
            "SELECT loan_id, customer_id, product, currency, sanctioned_amount, outstanding, interest_rate, tenure_months, start_date, status, days_past_due, collateral_value, limit_amount FROM loans WHERE customer_id = ? ORDER BY loan_id",
            [customer_id]
        )
        
        return [
            LoanItem(
                loan_id=str(r.get("loan_id")),
                customer_id=safe_int(r.get("customer_id")),
                product=str(r.get("product")) if r.get("product") else "PERSONAL",
                currency=str(r.get("currency")) if r.get("currency") else "INR",
                sanctioned_amount=safe_float(r.get("sanctioned_amount")),
                outstanding=safe_float(r.get("outstanding")),
                interest_rate=safe_float(r.get("interest_rate")),
                tenure_months=safe_int(r.get("tenure_months")),
                start_date=str(r.get("start_date")) if r.get("start_date") else None,
                status=str(r.get("status")) if r.get("status") else "CURRENT",
                days_past_due=safe_int(r.get("days_past_due")),
                collateral_value=safe_float(r.get("collateral_value")),
                limit_amount=safe_float(r.get("limit_amount"))
            ) for r in rows
        ]

    @staticmethod
    def get_transactions(customer_id: int) -> List[TransactionItem]:
        rows = fetch_all_dict(
            "SELECT txn_id, account_id, customer_id, txn_date, value_date, amount, txn_type, counterparty, narrative, channel, is_suspicious FROM transactions WHERE customer_id = ? ORDER BY txn_date DESC, txn_id DESC",
            [customer_id]
        )
        
        return [
            TransactionItem(
                txn_id=str(r.get("txn_id")),
                account_id=safe_int(r.get("account_id")),
                customer_id=safe_int(r.get("customer_id")),
                txn_date=str(r.get("txn_date")),
                value_date=str(r.get("value_date")) if r.get("value_date") else None,
                amount=safe_float(r.get("amount")),
                txn_type=str(r.get("txn_type")) if r.get("txn_type") else "DEBIT",
                counterparty=str(r.get("counterparty")) if r.get("counterparty") else None,
                narrative=str(r.get("narrative")) if r.get("narrative") else None,
                channel=str(r.get("channel")) if r.get("channel") else None,
                is_suspicious=str(r.get("is_suspicious")) if r.get("is_suspicious") else "N"
            ) for r in rows
        ]

    @staticmethod
    def get_applications(customer_id: int) -> List[LoanApplicationItem]:
        rows = fetch_all_dict(
            "SELECT application_id, customer_id, product, requested_amount, tenure_months, existing_emi, credit_score, purpose, decision_label FROM loan_applications WHERE customer_id = ? ORDER BY application_id",
            [customer_id]
        )
        
        return [
            LoanApplicationItem(
                application_id=str(r.get("application_id")),
                customer_id=safe_int(r.get("customer_id")),
                product=str(r.get("product")) if r.get("product") else "PERSONAL",
                requested_amount=safe_float(r.get("requested_amount")),
                tenure_months=safe_int(r.get("tenure_months")),
                existing_emi=safe_float(r.get("existing_emi")),
                credit_score=safe_int(r.get("credit_score")),
                purpose=str(r.get("purpose")) if r.get("purpose") else None,
                decision_label=str(r.get("decision_label")) if r.get("decision_label") else "REFER"
            ) for r in rows
        ]

    @staticmethod
    def get_limits(customer_id: int) -> List[LimitCollateralItem]:
        rows = fetch_all_dict(
            "SELECT customer_id, limit_id, limit_product, currency, approved_limit, utilized, available, collateral_id, collateral_type, collateral_value FROM limits_collateral WHERE customer_id = ?",
            [customer_id]
        )
        
        return [
            LimitCollateralItem(
                customer_id=safe_int(r.get("customer_id")),
                limit_id=str(r.get("limit_id")) if r.get("limit_id") else None,
                limit_product=str(r.get("limit_product")) if r.get("limit_product") else None,
                currency=str(r.get("currency")) if r.get("currency") else "INR",
                approved_limit=safe_float(r.get("approved_limit")),
                utilized=safe_float(r.get("utilized")),
                available=safe_float(r.get("available")),
                collateral_id=str(r.get("collateral_id")) if r.get("collateral_id") else None,
                collateral_type=str(r.get("collateral_type")) if r.get("collateral_type") else None,
                collateral_value=safe_float(r.get("collateral_value"))
            ) for r in rows
        ]

    @classmethod
    def get_customer_360(cls, customer_id: int) -> Optional[Customer360Response]:
        profile = cls.get_customer_profile(customer_id)
        if not profile:
            return None
            
        accounts = cls.get_accounts(customer_id)
        loans = cls.get_loans(customer_id)
        transactions = cls.get_transactions(customer_id)
        applications = cls.get_applications(customer_id)
        limits = cls.get_limits(customer_id)
        
        # Calculate key metrics safely
        total_balance = sum(a.working_balance for a in accounts)
        total_sanctioned = sum(l.sanctioned_amount for l in loans)
        total_outstanding = sum(l.outstanding for l in loans)
        max_dpd = max((l.days_past_due for l in loans), default=0)
        
        total_approved = sum(lim.approved_limit for lim in limits)
        total_utilized = sum(lim.utilized for lim in limits)
        total_available = sum(lim.available for lim in limits)
        
        suspicious_count = sum(1 for t in transactions if t.is_suspicious == 'Y')
        
        # Build deterministic citation record references
        citations: List[CitationEvidence] = []
        
        # Customer Profile Citation
        citations.append(CitationEvidence(
            table="customers.csv",
            record_id=str(profile.customer_id),
            field_name="kyc_status",
            value=profile.kyc_status,
            description="Customer master record KYC status"
        ))
        citations.append(CitationEvidence(
            table="customers.csv",
            record_id=str(profile.customer_id),
            field_name="monthly_income",
            value=f"₹{profile.monthly_income:,.2f}",
            description="Declared monthly income"
        ))
        
        # Account Citations
        for acc in accounts:
            citations.append(CitationEvidence(
                table="accounts.csv",
                record_id=str(acc.account_id),
                field_name="working_balance",
                value=f"₹{acc.working_balance:,.2f}",
                description=f"Working balance for {acc.account_title}"
            ))
            
        # Loan Citations
        for ln in loans:
            citations.append(CitationEvidence(
                table="loans.csv",
                record_id=ln.loan_id,
                field_name="outstanding",
                value=f"₹{ln.outstanding:,.2f}",
                description=f"Outstanding principal on {ln.product} loan (Status: {ln.status}, DPD: {ln.days_past_due})"
            ))
            
        # Suspicious Transaction Citations
        for txn in transactions:
            if txn.is_suspicious == 'Y':
                citations.append(CitationEvidence(
                    table="transactions.csv",
                    record_id=txn.txn_id,
                    field_name="is_suspicious",
                    value="Y",
                    description=f"Suspicious transaction flag on {txn.txn_date} ({txn.narrative}, Amount: ₹{abs(txn.amount):,.2f})"
                ))

        # Limit Citations
        for lim in limits:
            if lim.limit_id:
                citations.append(CitationEvidence(
                    table="limits_collateral.csv",
                    record_id=lim.limit_id,
                    field_name="approved_limit",
                    value=f"₹{lim.approved_limit:,.2f}",
                    description=f"Approved credit limit (Utilized: ₹{lim.utilized:,.2f})"
                ))

        return Customer360Response(
            customer=profile,
            accounts=accounts,
            loans=loans,
            transactions=transactions,
            applications=applications,
            limits=limits,
            total_working_balance=round(total_balance, 2),
            total_sanctioned_loan=round(total_sanctioned, 2),
            total_outstanding_loan=round(total_outstanding, 2),
            max_days_past_due=max_dpd,
            total_approved_limit=round(total_approved, 2),
            total_utilized_limit=round(total_utilized, 2),
            total_available_limit=round(total_available, 2),
            suspicious_txn_count=suspicious_count,
            citations=citations
        )
