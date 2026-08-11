from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    CustomerBasicInfo, CustomerProfile, Customer360Response,
    AccountItem, LoanItem, TransactionItem, LoanApplicationItem, LimitCollateralItem,
    KycAssessmentResponse, FaqItem, FaqQueryRequest, FaqQueryResponse
)
from services.customer_service import CustomerService
from services.kyc_service import KycService
from services.faq_service import FaqService
from db import get_db

app = FastAPI(
    title="Banking Intelligence Assistant API",
    version="2.0.0",
    description="Explainable Banking AI Backend (Customer 360, KYC Completeness, & Restricted Bank FAQ RAG)."
)

# Enable CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Initialize DuckDB database connection & load CSV datasets
    get_db()
    # Pre-load FAQ knowledge base
    FaqService.load_faqs()

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "Banking Intelligence Assistant API",
        "phase": "Phase 2 (50% Completion)"
    }

# --- B1: CUSTOMER 360 ENDPOINTS ---

@app.get("/api/customers", response_model=List[CustomerBasicInfo])
def list_customers(query: Optional[str] = Query(None, description="Search by customer ID or name"), limit: int = 50):
    return CustomerService.list_customers(query=query, limit=limit)

@app.get("/api/customers/{customer_id}", response_model=CustomerProfile)
def get_customer(customer_id: int):
    profile = CustomerService.get_customer_profile(customer_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Customer ID {customer_id} not found")
    return profile

@app.get("/api/customers/{customer_id}/360", response_model=Customer360Response)
def get_customer_360(customer_id: int):
    c360 = CustomerService.get_customer_360(customer_id)
    if not c360:
        raise HTTPException(status_code=404, detail=f"Customer ID {customer_id} not found")
    return c360

@app.get("/api/customers/{customer_id}/accounts", response_model=List[AccountItem])
def get_customer_accounts(customer_id: int):
    return CustomerService.get_accounts(customer_id)

@app.get("/api/customers/{customer_id}/loans", response_model=List[LoanItem])
def get_customer_loans(customer_id: int):
    return CustomerService.get_loans(customer_id)

@app.get("/api/customers/{customer_id}/transactions", response_model=List[TransactionItem])
def get_customer_transactions(customer_id: int):
    return CustomerService.get_transactions(customer_id)

@app.get("/api/customers/{customer_id}/limits", response_model=List[LimitCollateralItem])
def get_customer_limits(customer_id: int):
    return CustomerService.get_limits(customer_id)

@app.get("/api/customers/{customer_id}/applications", response_model=List[LoanApplicationItem])
def get_customer_applications(customer_id: int):
    return CustomerService.get_applications(customer_id)

# --- B2: KYC COMPLETENESS ASSISTANT ENDPOINTS ---

@app.get("/api/customers/{customer_id}/kyc", response_model=KycAssessmentResponse)
def get_customer_kyc(customer_id: int):
    assessment = KycService.evaluate_customer_kyc(customer_id)
    if not assessment:
        raise HTTPException(status_code=404, detail=f"Customer ID {customer_id} not found")
    return assessment

# --- B3: BANK FAQ ASSISTANT ENDPOINTS ---

@app.get("/api/faq/list", response_model=List[FaqItem])
def list_faqs():
    return FaqService.list_faqs()

@app.post("/api/faq/query", response_model=FaqQueryResponse)
def query_faq(req: FaqQueryRequest):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    return FaqService.answer_faq(req)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
