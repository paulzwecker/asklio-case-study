// src/lib/api.ts

import type { ProcurementRequest, OfferExtractionResult } from '@/lib/types';

// TODO: adjust base URL for FastAPI backend (e.g. http://localhost:8000/api)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

export async function createProcurementRequest(
  payload: Omit<ProcurementRequest, 'id' | 'status' | 'created_at' | 'updated_at'>
): Promise<ProcurementRequest> {
  // TODO: Implement real POST /requests call to FastAPI
  const res = await fetch(`${API_BASE_URL}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to create procurement request');
  }

  return res.json();
}

export async function listProcurementRequests(): Promise<ProcurementRequest[]> {
  // TODO: Implement real GET /requests call to FastAPI
  const res = await fetch(`${API_BASE_URL}/requests`, {
    next: { revalidate: 5 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch procurement requests');
  }

  return res.json();
}

export async function getProcurementRequest(id: string): Promise<ProcurementRequest> {
  // TODO: Implement real GET /requests/{id} call to FastAPI
  const res = await fetch(`${API_BASE_URL}/requests/${id}`, {
    next: { revalidate: 5 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch procurement request');
  }

  return res.json();
}

export async function parseOffer(file: File): Promise<OfferExtractionResult> {
  // TODO: Implement real POST /offers/parse call to FastAPI
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/offers/parse`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed to parse offer document');
  }

  return res.json();
}
