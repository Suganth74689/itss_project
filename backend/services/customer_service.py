from typing import List, Optional, Dict, Any
from db import get_db
from schemas import (
    CustomerProfile, AccountItem, LoanItem, TransactionItem,
    LoanApplicationItem, LimitCollateralItem, Customer360Response,
    CitationEvidence, CustomerBasicInfo
)

class CustomerService:
    @staticmethod
    def list_customers(query: Optional[str] = None, limit: int = 50) -> List[CustomerBasicInfo]:
        conn = get_db()
        sql = "SELECT customer_id, name_1, kyc_status, monthly_income, employment_type FROM customers"
        params = []
        
        if query:
            sql += " WHERE CAST(customer_id AS VARCHAR) LIKE ? OR LOWER(name_1) LIKE ?"
            q_param = f"%{query.strip().lower()}%"
            params = [f"%{query.strip()}%", q_param]
            
        sql += " ORDER BY customer_id ASC LIMIT ?"
        params.append(limit)
        
        rows = conn.execute(sql, params).fetchall()
        result = []
        for r in rows:
            result.append(CustomerBasicInfo(
                customer_id=r[0],
                name_1=r[1],
                kyc_status=r[2] if r[2] else "UNKNOWN",
                monthly_income=float(r[3] or 0),
                employment_type=r[4]
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
            customer_id=row[0],
            mnemonic=row[1],
            short_name=row[2],
            name_1=row[3],
            street=row[4],
            town_country=row[5],
            nationality=row[6],
            residence=row[7],
            sector=row[8],
            account_officer=row[9],
            date_of_birth=str(row[10]) if row[10] else None,
            customer_status=row[11],
            kyc_status=row[12] if row[12] else "UNKNOWN",
            monthly_income=float(row[13] or 0),
            employment_type=row[14]
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
                account_id=r[0],
                customer_id=r[1],
                category=r[2],
                currency=r[3] or "INR",
                account_title=r[4] or "",
                opening_date=str(r[5]) if r[5] else None,
                working_balance=float(r[6] or 0),
                posting_restrict=r[7],
                product=r[8]
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
                customer_id=r[1],
                product=r[2] or "PERSONAL",
                currency=r[3] or "INR",
                sanctioned_amount=float(r[4] or 0),
                outstanding=float(r[5] or 0),
                interest_rate=float(r[6] or 0),
                tenure_months=int(r[7] or 0),
                start_date=str(r[8]) if r[8] else None,
                status=r[9] or "CURRENT",
                days_past_due=int(r[10] or 0),
                collateral_value=float(r[11] or 0),
                limit_amount=float(r[12] or 0)
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
                account_id=r[1],
                customer_id=r[2],
                txn_date=str(r[3]),
                value_date=str(r[4]) if r[4] else None,
                amount=float(r[5] or 0),
                txn_type=r[6] or "DEBIT",
                counterparty=r[7],
                narrative=r[8],
                channel=r[9],
                is_suspicious=r[10] or "N"
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
                customer_id=r[1],
                product=r[2] or "PERSONAL",
                requested_amount=float(r[3] or 0),
                tenure_months=int(r[4] or 0),
                existing_emi=float(r[5] or 0),
                credit_score=int(r[6] or 0),
                purpose=r[7],
                decision_label=r[8] or "REFER"
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
                customer_id=r[0],
                limit_id=str(r[1]) if r[1] else None,
                limit_product=r[2],
                currency=r[3] or "INR",
                approved_limit=float(r[4] or 0),
                utilized=float(r[5] or 0),
                available=float(r[6] or 0),
                collateral_id=str(r[7]) if r[7] else None,
                collateral_type=r[8],
                collateral_value=float(r[9] or 0)
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
        
        # Calculate key metrics
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
