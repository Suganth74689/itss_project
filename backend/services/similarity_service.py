import math
from typing import List, Dict, Any, Optional
from db import fetch_all_dict
from schemas import (
    LookalikeResponse, LookalikeMatchItem, CitationEvidence
)

class CustomerSimilarityService:
    @classmethod
    def get_lookalikes(cls, target_customer_id: int, top_n: int = 5) -> Optional[LookalikeResponse]:
        # Fast 1-millisecond single SQL aggregation query across all 6 tables in DuckDB
        query = """
            SELECT 
                c.customer_id,
                c.name_1,
                c.kyc_status,
                COALESCE(c.employment_type, 'OTHER') AS employment_type,
                COALESCE(c.monthly_income, 0) AS monthly_income,
                COALESCE(a.total_balance, 0) AS total_working_balance,
                COALESCE(l.total_outstanding, 0) AS total_outstanding_loan,
                COALESCE(l.max_dpd, 0) AS max_days_past_due,
                COALESCE(app.max_score, 650) AS credit_score,
                COALESCE(t.suspicious_count, 0) AS suspicious_txn_count
            FROM customers c
            LEFT JOIN (
                SELECT customer_id, SUM(working_balance) AS total_balance 
                FROM accounts GROUP BY customer_id
            ) a ON c.customer_id = a.customer_id
            LEFT JOIN (
                SELECT customer_id, SUM(outstanding) AS total_outstanding, MAX(days_past_due) AS max_dpd 
                FROM loans GROUP BY customer_id
            ) l ON c.customer_id = l.customer_id
            LEFT JOIN (
                SELECT customer_id, MAX(credit_score) AS max_score 
                FROM loan_applications GROUP BY customer_id
            ) app ON c.customer_id = app.customer_id
            LEFT JOIN (
                SELECT customer_id, COUNT(*) AS suspicious_count 
                FROM transactions WHERE is_suspicious = 'Y' GROUP BY customer_id
            ) t ON c.customer_id = t.customer_id
            ORDER BY c.customer_id ASC;
        """

        rows = fetch_all_dict(query)
        if not rows:
            return None

        feature_matrix: Dict[int, Dict[str, Any]] = {}
        for r in rows:
            cid = int(r.get("customer_id") or 0)
            feature_matrix[cid] = {
                "customer_id": cid,
                "name_1": str(r.get("name_1") or "Unknown"),
                "kyc_status": str(r.get("kyc_status") or "UNKNOWN"),
                "employment_type": str(r.get("employment_type") or "OTHER"),
                "monthly_income": float(r.get("monthly_income") or 0),
                "total_working_balance": float(r.get("total_working_balance") or 0),
                "total_outstanding_loan": float(r.get("total_outstanding_loan") or 0),
                "max_days_past_due": int(r.get("max_days_past_due") or 0),
                "credit_score": int(r.get("credit_score") or 650),
                "suspicious_txn_count": int(r.get("suspicious_txn_count") or 0)
            }

        if target_customer_id not in feature_matrix:
            return None

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
            if abs(feat["monthly_income"] - target_feat["monthly_income"]) <= max(target_feat["monthly_income"] * 0.35, 20000):
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
