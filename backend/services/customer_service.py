from typing import List, Optional, Dict, Any
from db import get_db
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
        conn = get_db()
        sql = "SELECT customer_id, name_1, kyc_status, monthly_income, employment_type FROM customers"
        params = []
        
        if query and query.strip():
            sql += " WHERE CAST(customer_id AS VARCHAR) LIKE ? OR LOWER(name_1) LIKE ?"
            q_param = f"%{query.strip().lower()}%"
            params = [f"%{query.strip()}%", q_param]
            
        sql += " ORDER BY customer_id ASC LIMIT ?"
        params.append(limit)
        
        rows = conn.execute(sql, params).fetchall()
        result = []
        for r in rows:
            result.append(CustomerBasicInfo(
                customer_id=safe_int(r[0]),
                name_1=str(r[1] or "Unknown"),
                kyc_status=str(r[2]) if r[2] else "UNKNOWN",
                monthly_income=safe_float(r[3]),
                employment_type=str(r[4]) if r[4] else None
            ))
        return result

    @staticmethod
    def get_customer_profile(customer_id: int) -> Optional[CustomerProfile]:
        conn = get_db()
        row = conn.execute(
            "SELECT customer_id, mnemonic, short_name, name_1, street, town_country, nationality, residence, sector, account_officer, date_of_birth, customer_status, kyc_status, monthly_income, employment_type FROM customers WHERE customer_id = ?",
            [customer_id]
        ).fetchone()
        
        if not row:
            return None
            
        return CustomerProfile(
            customer_id=safe_int(row[0]),
            mnemonic=str(row[1]) if row[1] else None,
            short_name=str(row[2]) if row[2] else None,
            name_1=str(row[3] or "Unknown"),
            street=str(row[4]) if row[4] else None,
            town_country=str(row[5]) if row[5] else None,
            nationality=str(row[6]) if row[6] else None,
            residence=str(row[7]) if row[7] else None,
            sector=safe_int(row[8]) if row[8] is not None else None,
            account_officer=safe_int(row[9]) if row[9] is not None else None,
            date_of_birth=str(row[10]) if row[10] else None,
            customer_status=safe_int(row[11]) if row[11] is not None else None,
            kyc_status=str(row[12]) if row[12] else "UNKNOWN",
            monthly_income=safe_float(row[13]),
            employment_type=str(row[14]) if row[14] else None
        )

    @staticmethod
    def get_accounts(customer_id: int) -> List[AccountItem]:
        conn = get_db()
        rows = conn.execute(
            "SELECT account_id, customer_id, category, currency, account_title, opening_date, working_balance, posting_restrict, product FROM accounts WHERE customer_id = ? ORDER BY account_id",
            [customer_id]
        ).fetchall()
        
        return [
            AccountItem(
                account_id=safe_int(r[0]),
                customer_id=safe_int(r[1]),
                category=safe_int(r[2]),
                currency=str(r[3]) if r[3] else "INR",
                account_title=str(r[4]) if r[4] else "",
                opening_date=str(r[5]) if r[5] else None,
                working_balance=safe_float(r[6]),
                posting_restrict=str(r[7]) if r[7] else None,
                product=str(r[8]) if r[8] else None
            ) for r in rows
        ]

    @staticmethod
    def get_loans(customer_id: int) -> List[LoanItem]:
        conn = get_db()
        rows = conn.execute(
            "SELECT loan_id, customer_id, product, currency, sanctioned_amount, outstanding, interest_rate, tenure_months, start_date, status, days_past_due, collateral_value, limit_amount FROM loans WHERE customer_id = ? ORDER BY loan_id",
            [customer_id]
        ).fetchall()
        
        return [
            LoanItem(
                loan_id=str(r[0]),
                customer_id=safe_int(r[1]),
                product=str(r[2]) if r[2] else "PERSONAL",
                currency=str(r[3]) if r[3] else "INR",
                sanctioned_amount=safe_float(r[4]),
                outstanding=safe_float(r[5]),
                interest_rate=safe_float(r[6]),
                tenure_months=safe_int(r[7]),
                start_date=str(r[8]) if r[8] else None,
                status=str(r[9]) if r[9] else "CURRENT",
                days_past_due=safe_int(r[10]),
                collateral_value=safe_float(r[11]),
                limit_amount=safe_float(r[12])
            ) for r in rows
        ]

    @staticmethod
    def get_transactions(customer_id: int) -> List[TransactionItem]:
        conn = get_db()
        rows = conn.execute(
            "SELECT txn_id, account_id, customer_id, txn_date, value_date, amount, txn_type, counterparty, narrative, channel, is_suspicious FROM transactions WHERE customer_id = ? ORDER BY txn_date DESC, txn_id DESC",
            [customer_id]
        ).fetchall()
        
        return [
            TransactionItem(
                txn_id=str(r[0]),
                account_id=safe_int(r[1]),
                customer_id=safe_int(r[2]),
                txn_date=str(r[3]),
                value_date=str(r[4]) if r[4] else None,
                amount=safe_float(r[5]),
                txn_type=str(r[6]) if r[6] else "DEBIT",
                counterparty=str(r[7]) if r[7] else None,
                narrative=str(r[8]) if r[8] else None,
                channel=str(r[9]) if r[9] else None,
                is_suspicious=str(r[10]) if r[10] else "N"
            ) for r in rows
        ]

    @staticmethod
    def get_applications(customer_id: int) -> List[LoanApplicationItem]:
        conn = get_db()
        rows = conn.execute(
            "SELECT application_id, customer_id, product, requested_amount, tenure_months, existing_emi, credit_score, purpose, decision_label FROM loan_applications WHERE customer_id = ? ORDER BY application_id",
            [customer_id]
        ).fetchall()
        
        return [
            LoanApplicationItem(
                application_id=str(r[0]),
                customer_id=safe_int(r[1]),
                product=str(r[2]) if r[2] else "PERSONAL",
                requested_amount=safe_float(r[3]),
                tenure_months=safe_int(r[4]),
                existing_emi=safe_float(r[5]),
                credit_score=safe_int(r[6]),
                purpose=str(r[7]) if r[7] else None,
                decision_label=str(r[8]) if r[8] else "REFER"
            ) for r in rows
        ]

    @staticmethod
    def get_limits(customer_id: int) -> List[LimitCollateralItem]:
        conn = get_db()
        rows = conn.execute(
            "SELECT customer_id, limit_id, limit_product, currency, approved_limit, utilized, available, collateral_id, collateral_type, collateral_value FROM limits_collateral WHERE customer_id = ?",
            [customer_id]
        ).fetchall()
        
        return [
            LimitCollateralItem(
                customer_id=safe_int(r[0]),
                limit_id=str(r[1]) if r[1] else None,
                limit_product=str(r[2]) if r[2] else None,
                currency=str(r[3]) if r[3] else "INR",
                approved_limit=safe_float(r[4]),
                utilized=safe_float(r[5]),
                available=safe_float(r[6]),
                collateral_id=str(r[7]) if r[7] else None,
                collateral_type=str(r[8]) if r[8] else None,
                collateral_value=safe_float(r[9])
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
