import type { CustomerBasicInfo, Customer360Response, KycAssessmentResponse, KycVerifyDocumentRequest, KycVerifyDocumentResponse, FaqQueryResponse, FaqItem } from './types';

const API_BASE = '/api';

export async function fetchCustomers(query?: string): Promise<CustomerBasicInfo[]> {
  const url = query && query.trim() ? 
    `${API_BASE}/customers?query=${encodeURIComponent(query.trim())}`
    : `${API_BASE}/customers`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch customers list');
  return res.json();
}

export async function fetchCustomer360(customerId: number): Promise<Customer360Response> {
  const validId = Number(customerId);
  if (!validId || isNaN(validId)) {
    throw new Error(`Invalid Customer ID: ${customerId}`);
  }
  const res = await fetch(`${API_BASE}/customers/${validId}/360`);
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Customer #${validId} not found in database`);
    throw new Error(`Failed to fetch Customer 360 profile for ID ${validId}`);
  }
  return res.json();
}

export async function fetchCustomerKyc(customerId: number): Promise<KycAssessmentResponse> {
  const validId = Number(customerId);
  if (!validId || isNaN(validId)) {
    throw new Error(`Invalid Customer ID: ${customerId}`);
  }
  const res = await fetch(`${API_BASE}/customers/${validId}/kyc`);
  if (!res.ok) {
    if (res.status === 404) throw new Error(`KYC assessment not found for Customer #${validId}`);
    throw new Error(`Failed to fetch KYC Assessment for Customer ID ${validId}`);
  }
  return res.json();
}

export async function verifyCustomerKycDocument(customerId: number, req: KycVerifyDocumentRequest): Promise<KycVerifyDocumentResponse> {
  const validId = Number(customerId);
  if (!validId || isNaN(validId)) {
    throw new Error(`Invalid Customer ID: ${customerId}`);
  }
  const res = await fetch(`${API_BASE}/customers/${validId}/kyc/verify`, {
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
