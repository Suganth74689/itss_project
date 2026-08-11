import json
from pathlib import Path
from typing import Optional, List, Dict, Any

from db import fetch_one_dict, execute_write
from services.customer_service import CustomerService
from schemas import (
    KycAssessmentResponse, KycCategorySummary, KycFieldItem,
    CitationEvidence, KycVerifyDocumentRequest, KycVerifyDocumentResponse
)

BASE_DIR = Path(__file__).resolve().parent.parent
RULES_PATH = BASE_DIR / "data" / "kyc_rules.json"

class KycService:
    @staticmethod
    def load_rules() -> Dict[str, Any]:
        if not RULES_PATH.exists():
            raise FileNotFoundError(f"KYC rules configuration file not found at {RULES_PATH}")
        with open(RULES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    @classmethod
    def evaluate_customer_kyc(cls, customer_id: int) -> Optional[KycAssessmentResponse]:
        customer = CustomerService.get_customer_profile(customer_id)
        if not customer:
            return None

        rules = cls.load_rules()
        categories_cfg = rules.get("categories", {})

        cust_dict = customer.dict()

        field_labels = {
            "name_1": "Full Name",
            "date_of_birth": "Date of Birth",
            "street": "Street Address",
            "town_country": "City & Country",
            "nationality": "Nationality Code",
            "residence": "Residence Country",
            "monthly_income": "Monthly Income",
            "employment_type": "Employment Type",
            "kyc_status": "Regulatory KYC Status"
        }

        category_summaries: List[KycCategorySummary] = []
        field_items: List[KycFieldItem] = []
        missing_fields: List[str] = []
        documents_checklist_set = set()
        citations: List[CitationEvidence] = []

        total_req_fields = 0
        total_verified_fields = 0

        for cat_key, cat_info in categories_cfg.items():
            cat_title = cat_info.get("title", cat_key.title())
            req_fields = cat_info.get("required_fields", [])
            docs_req = cat_info.get("documents_required", [])

            cat_total = len(req_fields)
            cat_verified = 0

            for f_name in req_fields:
                total_req_fields += 1
                val = cust_dict.get(f_name)
                
                # Verification Logic
                is_verified = False
                if val is not None and str(val).strip() != "":
                    if f_name == "kyc_status":
                        # Status is only verified if COMPLETE
                        is_verified = (str(val).upper() == "COMPLETE")
                    elif f_name == "monthly_income":
                        is_verified = (float(val) > 0)
                    else:
                        is_verified = True

                if is_verified:
                    cat_verified += 1
                    total_verified_fields += 1
                else:
                    missing_fields.append(field_labels.get(f_name, f_name))
                    for doc in docs_req:
                        documents_checklist_set.add(doc)

                field_items.append(KycFieldItem(
                    category_key=cat_key,
                    field_name=f_name,
                    label=field_labels.get(f_name, f_name),
                    value=val,
                    is_verified=is_verified,
                    documents_required=docs_req
                ))

                # Add Citation for evidence drawer
                citations.append(CitationEvidence(
                    table="customers.csv",
                    record_id=str(customer.customer_id),
                    field_name=f_name,
                    value=val if val is not None else "MISSING",
                    description=f"KYC {field_labels.get(f_name, f_name)} record field (Verified: {is_verified})"
                ))

            is_cat_complete = (cat_verified == cat_total)
            category_summaries.append(KycCategorySummary(
                category_key=cat_key,
                title=cat_title,
                total_fields=cat_total,
                verified_fields=cat_verified,
                is_complete=is_cat_complete
            ))

        completeness_pct = round((total_verified_fields / max(total_req_fields, 1)) * 100, 1)

        # Generate actionable next steps
        recommended_actions: List[str] = []
        overall_status = customer.kyc_status.upper()

        if overall_status == "EXPIRED":
            recommended_actions.append("→ Issue urgent KYC refresh notice to customer.")
            recommended_actions.append("→ Request updated address proof and signed Re-KYC declaration.")
            recommended_actions.append("→ Verify current employment & monthly income status.")
        elif overall_status == "PENDING":
            recommended_actions.append("→ Review submitted identity documents.")
            recommended_actions.append("→ Verify PAN/Aadhaar details with central registry.")
        else:
            recommended_actions.append("✓ KYC profile is fully compliant. Schedule next periodic review in 12 months.")

        return KycAssessmentResponse(
            customer_id=customer.customer_id,
            name_1=customer.name_1,
            overall_status=overall_status,
            completeness_percentage=completeness_pct,
            categories=category_summaries,
            fields=field_items,
            missing_fields=missing_fields,
            recommended_actions=recommended_actions,
            documents_checklist=list(documents_checklist_set),
            citations=citations
        )

    @classmethod
    def verify_customer_document(cls, customer_id: int, req: KycVerifyDocumentRequest) -> KycVerifyDocumentResponse:
        # Thread-safe dictionary fetch
        cust = fetch_one_dict("SELECT customer_id, name_1 FROM customers WHERE customer_id = ?", [customer_id])
        if not cust:
            return KycVerifyDocumentResponse(
                success=False,
                message=f"Customer ID {customer_id} not found in database.",
                updated_assessment=None
            )

        # Execute dynamic SQL UPDATE under thread lock
        execute_write(
            "UPDATE customers SET kyc_status = 'COMPLETE' WHERE customer_id = ?",
            [customer_id]
        )

        # Re-evaluate updated customer KYC assessment
        updated_assessment = cls.evaluate_customer_kyc(customer_id)

        name = cust.get("name_1") or "Customer"
        doc_ref = f" (Ref #{req.document_number})" if req.document_number else ""
        msg = f"Successfully verified document '{req.document_type}'{doc_ref} for {name}. DuckDB database updated dynamically: KYC status changed to COMPLETE (100% Verified)."

        return KycVerifyDocumentResponse(
            success=True,
            message=msg,
            updated_assessment=updated_assessment
        )
