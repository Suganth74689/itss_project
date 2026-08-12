import os
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from db import reset_db
from schemas import (
    CustomerBasicInfo, Customer360Response, AccountItem, LoanItem,
    TransactionItem, LoanApplicationItem, LimitCollateralItem,
    KycAssessmentResponse, KycVerifyDocumentRequest, KycVerifyDocumentResponse,
    FaqItem, FaqQueryRequest, FaqQueryResponse, LookalikeResponse, OllamaStatusResponse,
    LoginRequest, LoginResponse, UserResponse
)
from services.customer_service import CustomerService
from services.kyc_service import KycService
from services.faq_service import FaqService
from services.similarity_service import CustomerSimilarityService
from services.auth_service import AuthService

app = FastAPI(
    title="Banking Intelligence Assistant API",
    description="Core Banking 360 Aggregator, KYC Compliance Assistant, Restricted FAQ RAG Engine, and Lookalike Customer Explainer",
    version="1.0.0"
)

# Enable CORS for local Vite frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/api/auth/login", response_model=LoginResponse)
def login(req: LoginRequest):
    res = AuthService.authenticate_user(req)
    if not res.success:
        raise HTTPException(status_code=401, detail=res.message)
    return res

@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user(token: str = Query(..., description="Active session token")):
    user = AuthService.get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")
    return user

@app.post("/api/auth/logout")
def logout(token: str = Query(..., description="Active session token")):
    success = AuthService.logout_user(token)
    return {"status": "success", "logged_out": success}

# --- SYSTEM HEALTH & RESET ENDPOINTS ---

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "engine": "DuckDB In-Memory Core Banking API", "version": "1.0.0"}

@app.post("/api/db/reset")
def reset_database():
    success = reset_db()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to reset DuckDB database")
    return {"status": "success", "message": "DuckDB database successfully re-initialized from raw CSV files"}

# --- B1: CUSTOMER 360 AGGREGATOR ENDPOINTS ---

@app.get("/api/customers", response_model=List[CustomerBasicInfo])
def list_customers(query: Optional[str] = Query(None, description="Search query by customer ID or name"), limit: int = Query(50, ge=1, le=200)):
    return CustomerService.list_customers(query=query, limit=limit)

@app.get("/api/customers/{customer_id}/360", response_model=Customer360Response)
def get_customer_360(customer_id: int):
    c360 = CustomerService.get_customer_360(customer_id)
    if not c360:
        raise HTTPException(status_code=404, detail=f"Customer ID {customer_id} not found")
    return c360

@app.get("/api/customers/{customer_id}/profile")
def get_customer_profile(customer_id: int):
    profile = CustomerService.get_customer_profile(customer_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Customer ID {customer_id} not found")
    return profile

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

@app.post("/api/customers/{customer_id}/kyc/verify", response_model=KycVerifyDocumentResponse)
def verify_customer_kyc_document(customer_id: int, req: KycVerifyDocumentRequest):
    res = KycService.verify_customer_document(customer_id, req)
    if not res.success:
        raise HTTPException(status_code=400, detail=res.message)
    return res

# --- B3: BANK FAQ & OLLAMA RAG ASSISTANT ENDPOINTS ---

@app.get("/api/faq/list", response_model=List[FaqItem])
def list_faqs():
    return FaqService.list_faqs()

@app.get("/api/faq/ollama-status", response_model=OllamaStatusResponse)
def get_ollama_status():
    return FaqService.check_ollama_status()

@app.post("/api/faq/query", response_model=FaqQueryResponse)
def query_faq(req: FaqQueryRequest):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    return FaqService.answer_faq(req)

# --- B4: LOOKALIKE CUSTOMER EXPLAINER ENDPOINT ---

@app.get("/api/customers/{customer_id}/lookalikes", response_model=LookalikeResponse)
def get_customer_lookalikes(customer_id: int, top_n: int = Query(5, ge=1, le=20)):
    res = CustomerSimilarityService.get_lookalikes(customer_id, top_n=top_n)
    if not res:
        raise HTTPException(status_code=404, detail=f"Customer ID {customer_id} not found")
    return res

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
