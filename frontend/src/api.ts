import type { CustomerBasicInfo, Customer360Response, KycAssessmentResponse, KycVerifyDocumentRequest, KycVerifyDocumentResponse, FaqQueryResponse, FaqItem } from './types';

const API_BASE = '/api';

export async function fetchCustomers(query?: string): Promise<CustomerBasicInfo[]> {
  const url = query 
    ? `${API_BASE}/customers?query=${encodeURIComponent(query)}`
    : `${API_BASE}/customers`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch customers list');
  return res.json();
}

export async function fetchCustomer360(customerId: number): Promise<Customer360Response> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/360`);
  if (!res.ok) throw new Error(`Failed to fetch Customer 360 profile for ID ${customerId}`);
  return res.json();
}

export async function fetchCustomerKyc(customerId: number): Promise<KycAssessmentResponse> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/kyc`);
  if (!res.ok) throw new Error(`Failed to fetch KYC Assessment for Customer ID ${customerId}`);
  return res.json();
}

export async function verifyCustomerKycDocument(customerId: number, req: KycVerifyDocumentRequest): Promise<KycVerifyDocumentResponse> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/kyc/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Document verification failed' }));
    throw new Error(errData.detail || 'Document verification failed');
  }
  return res.json();
}

export async function resetDatabase(): Promise<void> {
  const res = await fetch(`${API_BASE}/db/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset DuckDB database');
}

export async function queryFaq(question: string): Promise<FaqQueryResponse> {
  const res = await fetch(`${API_BASE}/faq/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  if (!res.ok) throw new Error('Failed to process FAQ query');
  return res.json();
}

export async function fetchFaqs(): Promise<FaqItem[]> {
  const res = await fetch(`${API_BASE}/faq/list`);
  if (!res.ok) throw new Error('Failed to fetch FAQs list');
  return res.json();
}
