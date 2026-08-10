from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    CustomerBasicInfo, CustomerProfile, Customer360Response,
    AccountItem, LoanItem, TransactionItem, LoanApplicationItem, LimitCollateralItem
)
from services.customer_service import CustomerService
from db import get_db

app = FastAPI(
    title="Banking Intelligence Assistant API",
    version="1.0.0",
    description="Explainable Banking AI Backend grounded in DuckDB CSV data records."
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

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Banking Intelligence Assistant API"}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
