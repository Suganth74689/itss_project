import math
from typing import List, Dict, Any, Optional
from db import get_db
from services.customer_service import CustomerService, safe_float, safe_int
from schemas import (
    LookalikeResponse, LookalikeMatchItem, CitationEvidence
)

class CustomerSimilarityService:
    @classmethod
    def get_lookalikes(cls, target_customer_id: int, top_n: int = 5) -> Optional[LookalikeResponse]:
        target_360 = CustomerService.get_customer_360(target_customer_id)
        if not target_360:
            return None

        # Fetch all customers basic profiles from DuckDB
        conn = get_db()
        all_cust_rows = conn.execute("SELECT customer_id FROM customers ORDER BY customer_id ASC").fetchall()
        all_ids = [r[0] for r in all_cust_rows]

        # Extract features for all customers to compute normalized distance
        feature_matrix: Dict[int, Dict[str, Any]] = {}
        for cid in all_ids:
            c360 = CustomerService.get_customer_360(cid)
            if not c360:
                continue

            credit_score = 650
            if c360.applications and len(c360.applications) > 0:
                credit_score = max(app.credit_score for app in c360.applications)

            util_ratio = 0.0
            if c360.total_approved_limit > 0:
                util_ratio = c360.total_utilized_limit / c360.total_approved_limit

            feature_matrix[cid] = {
                "customer_id": cid,
                "name_1": c360.customer.name_1,
                "kyc_status": c360.customer.kyc_status,
                "employment_type": c360.customer.employment_type or "OTHER",
                "monthly_income": c360.customer.monthly_income,
                "total_working_balance": c360.total_working_balance,
                "total_outstanding_loan": c360.total_outstanding_loan,
                "max_days_past_due": c360.max_days_past_due,
                "credit_score": credit_score,
                "util_ratio": util_ratio,
                "suspicious_txn_count": c360.suspicious_txn_count,
            }

        target_feat = feature_matrix[target_customer_id]

        # MinMax Normalization bounds
        incomes = [f["monthly_income"] for f in feature_matrix.values()]
        balances = [f["total_working_balance"] for f in feature_matrix.values()]
        loans = [f["total_outstanding_loan"] for f in feature_matrix.values()]
        scores = [f["credit_score"] for f in feature_matrix.values()]

        max_inc, min_inc = max(incomes) or 1, min(incomes) or 0
        max_bal, min_bal = max(balances) or 1, min(balances) or 0
        max_loan, min_loan = max(loans) or 1, min(loans) or 0
        max_score, min_score = max(scores) or 850, min(scores) or 300

        scores_list = []

        for cid, feat in feature_matrix.items():
            if cid == target_customer_id:
                continue

            # Feature normalization (0.0 to 1.0)
            norm_inc = (feat["monthly_income"] - min_inc) / max(max_inc - min_inc, 1)
            target_norm_inc = (target_feat["monthly_income"] - min_inc) / max(max_inc - min_inc, 1)

            norm_bal = (feat["total_working_balance"] - min_bal) / max(max_bal - min_bal, 1)
            target_norm_bal = (target_feat["total_working_balance"] - min_bal) / max(max_bal - min_bal, 1)

            norm_loan = (feat["total_outstanding_loan"] - min_loan) / max(max_loan - min_loan, 1)
            target_norm_loan = (target_feat["total_outstanding_loan"] - min_loan) / max(max_loan - min_loan, 1)

            norm_score = (feat["credit_score"] - min_score) / max(max_score - min_score, 1)
            target_norm_score = (target_feat["credit_score"] - min_score) / max(max_score - min_score, 1)

            # Weighted Euclidean distance
            w_inc = 0.25 * ((norm_inc - target_norm_inc) ** 2)
            w_bal = 0.20 * ((norm_bal - target_norm_bal) ** 2)
            w_loan = 0.25 * ((norm_loan - target_norm_loan) ** 2)
            w_score = 0.20 * ((norm_score - target_norm_score) ** 2)
            w_emp = 0.10 * (0.0 if feat["employment_type"] == target_feat["employment_type"] else 1.0)

            dist = math.sqrt(w_inc + w_bal + w_loan + w_score + w_emp)
            sim_score = max(0.0, min(1.0, 1.0 - dist))
            sim_pct = round(sim_score * 100, 1)

            # Explainable "Why Similar" Feature Checklist
            matching_features: List[str] = []
            if abs(feat["monthly_income"] - target_feat["monthly_income"]) <= target_feat["monthly_income"] * 0.35:
                matching_features.append(f"Comparable monthly income (₹{feat['monthly_income']:,.0f} vs Target ₹{target_feat['monthly_income']:,.0f})")

            if feat["employment_type"] == target_feat["employment_type"]:
                matching_features.append(f"Matching employment sector: {feat['employment_type']}")

            if abs(feat["credit_score"] - target_feat["credit_score"]) <= 60:
                matching_features.append(f"Similar credit score range ({feat['credit_score']} vs Target {target_feat['credit_score']})")

            if abs(feat["total_outstanding_loan"] - target_feat["total_outstanding_loan"]) <= max(target_feat["total_outstanding_loan"] * 0.40, 100000):
                matching_features.append(f"Similar loan exposure profile (₹{feat['total_outstanding_loan']:,.0f})")

            if abs(feat["total_working_balance"] - target_feat["total_working_balance"]) <= max(target_feat["total_working_balance"] * 0.45, 200000):
                matching_features.append(f"Matching liquidity magnitude (₹{feat['total_working_balance']:,.0f})")

            if len(matching_features) == 0:
                matching_features.append("Baseline financial demographic alignment")

            # Explainable "Caution / Risk Discrepancies" Callouts
            risk_discrepancies: List[str] = []

            # 1. DPD Risk Mismatch
            dpd_diff = feat["max_days_past_due"] - target_feat["max_days_past_due"]
            if dpd_diff > 0:
                risk_discrepancies.append(f"⚠️ High DPD Overdue Risk: Lookalike has {feat['max_days_past_due']} DPD vs {target_feat['max_days_past_due']} DPD for Target Customer {target_customer_id}.")
            elif dpd_diff < 0:
                risk_discrepancies.append(f"ℹ️ DPD Advantage: Lookalike has {feat['max_days_past_due']} DPD vs {target_feat['max_days_past_due']} DPD for Target Customer.")

            # 2. KYC Compliance Status Discrepancy
            if feat["kyc_status"].upper() != target_feat["kyc_status"].upper():
                risk_discrepancies.append(f"⚠️ Regulatory KYC Mismatch: Lookalike KYC status is {feat['kyc_status']} vs {target_feat['kyc_status']} for Target.")

            # 3. Suspicious Transaction Alerts
            if feat["suspicious_txn_count"] > target_feat["suspicious_txn_count"]:
                risk_discrepancies.append(f"⚠️ Suspicious Activity Alert: Lookalike has {feat['suspicious_txn_count']} suspicious transaction flag(s) vs {target_feat['suspicious_txn_count']} for Target.")

            # 4. Credit Score Gap
            score_diff = target_feat["credit_score"] - feat["credit_score"]
            if score_diff >= 75:
                risk_discrepancies.append(f"⚠️ Credit Rating Gap: Lookalike credit score ({feat['credit_score']}) is {score_diff} pts lower than Target ({target_feat['credit_score']}).")

            if len(risk_discrepancies) == 0:
                risk_discrepancies.append("✓ No major risk discrepancies detected. Profiles exhibit matching risk posture.")

            # Source Record Evidence Citations
            match_citations = [
                CitationEvidence(
                    table="customers.csv",
                    record_id=str(cid),
                    field_name="monthly_income",
                    value=f"₹{feat['monthly_income']:,.2f}",
                    description=f"Lookalike #{cid} monthly income"
                ),
                CitationEvidence(
                    table="loans.csv",
                    record_id=str(cid),
                    field_name="max_days_past_due",
                    value=f"{feat['max_days_past_due']} Days",
                    description=f"Lookalike #{cid} max days past due"
                ),
                CitationEvidence(
                    table="loan_applications.csv",
                    record_id=str(cid),
                    field_name="credit_score",
                    value=feat["credit_score"],
                    description=f"Lookalike #{cid} bureau credit score"
                )
            ]

            scores_list.append(LookalikeMatchItem(
                customer_id=cid,
                name_1=feat["name_1"],
                similarity_score=round(sim_score, 4),
                similarity_pct=sim_pct,
                kyc_status=feat["kyc_status"],
                monthly_income=feat["monthly_income"],
                employment_type=feat["employment_type"],
                total_working_balance=feat["total_working_balance"],
                total_outstanding_loan=feat["total_outstanding_loan"],
                max_days_past_due=feat["max_days_past_due"],
                credit_score=feat["credit_score"],
                suspicious_txn_count=feat["suspicious_txn_count"],
                matching_features=matching_features,
                risk_discrepancies=risk_discrepancies,
                citations=match_citations
            ))

        # Sort by highest similarity percentage
        scores_list.sort(key=lambda x: x.similarity_pct, reverse=True)
        top_lookalikes = scores_list[:top_n]

        top_citations: List[CitationEvidence] = []
        for match in top_lookalikes:
            top_citations.extend(match.citations)

        return LookalikeResponse(
            target_customer_id=target_customer_id,
            target_customer_name=target_feat["name_1"],
            lookalikes=top_lookalikes,
            citations=top_citations
        )
