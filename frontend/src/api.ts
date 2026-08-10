import type { CustomerBasicInfo, Customer360Response } from './types';

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
