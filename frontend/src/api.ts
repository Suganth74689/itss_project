import type {
  CustomerBasicInfo, Customer360Response, KycAssessmentResponse,
  KycVerifyDocumentRequest, KycVerifyDocumentResponse, FaqQueryResponse,
  FaqItem, LookalikeResponse, OllamaStatusResponse,
  AuthUser, LoginCredentials, AuthResponse
} from './types';

const API_BASE = '/api';

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(errData.detail || 'Login failed. Please check credentials.');
  }
  return res.json();
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/me?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    throw new Error('Session expired or invalid');
  }
  return res.json();
}

export async function logoutUser(token: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout?token=${encodeURIComponent(token)}`, {
    method: 'POST'
  }).catch(() => {});
}

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

export async function fetchCustomerLookalikes(customerId: number, topN: number = 5): Promise<LookalikeResponse> {
  const validId = Number(customerId);
  if (!validId || isNaN(validId)) {
    throw new Error(`Invalid Customer ID: ${customerId}`);
  }
  const res = await fetch(`${API_BASE}/customers/${validId}/lookalikes?top_n=${topN}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Lookalikes not found for Customer #${validId}`);
    throw new Error(`Failed to fetch Lookalike Explainer data for Customer #${validId}`);
  }
  return res.json();
}

export async function resetDatabase(): Promise<void> {
  const res = await fetch(`${API_BASE}/db/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset DuckDB database');
}

export async function queryFaq(question: string, customerId?: number, preferredModel?: string): Promise<FaqQueryResponse> {
  const res = await fetch(`${API_BASE}/faq/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, customer_id: customerId || undefined, preferred_model: preferredModel || undefined })
  });
  if (!res.ok) throw new Error('Failed to process FAQ query');
  return res.json();
}

export async function fetchFaqs(): Promise<FaqItem[]> {
  const res = await fetch(`${API_BASE}/faq/list`);
  if (!res.ok) throw new Error('Failed to fetch FAQs list');
  return res.json();
}

export async function fetchOllamaStatus(): Promise<OllamaStatusResponse> {
  const res = await fetch(`${API_BASE}/faq/ollama-status`);
  if (!res.ok) throw new Error('Failed to fetch Ollama status');
  return res.json();
}
