// src/lib/api.ts

import type {
  ProcurementRequest,
  OfferExtractionResult,
  RequestStatus,
  OrderLine,
} from '@/lib/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const ensureBaseUrl = (): string => {
  if (!API_BASE_URL) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL is not configured. Set it to the FastAPI base URL.'
    );
  }
  return API_BASE_URL;
};

const buildUrl = (path: string, query?: URLSearchParams): string => {
  const base = ensureBaseUrl();
  const qs = query?.toString();
  return qs ? `${base}${path}?${qs}` : `${base}${path}`;
};

const handleApiResponse = async <T>(response: Response): Promise<T> => {
  let data: unknown = null;
  try {
    data = await response.clone().json();
  } catch {
    // Ignore JSON parse errors; data stays null.
  }

  if (!response.ok) {
    const message =
      (typeof data === 'object' &&
        data !== null &&
        'detail' in data &&
        typeof (data as { detail: unknown }).detail === 'string' &&
        (data as { detail: string }).detail) ||
      (typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof (data as { message: unknown }).message === 'string' &&
        (data as { message: string }).message) ||
      'Request to backend failed';

    throw new ApiError(response.status, message, data);
  }

  return data as T;
};

export type CreateProcurementRequestPayload = {
  requestor_name: string;
  title: string;
  vendor_name: string;
  vendor_vat_id: string;
  department: string;
  commodity_group: string | null;
  order_lines: OrderLine[];
  total_cost: number;
};

export interface ProcurementRequestFilters {
  status?: RequestStatus;
  department?: string;
  search?: string;
}

export async function createProcurementRequest(
  payload: CreateProcurementRequestPayload
): Promise<ProcurementRequest> {
  const response = await fetch(buildUrl('/requests'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  return handleApiResponse<ProcurementRequest>(response);
}

export async function listProcurementRequests(
  filters?: ProcurementRequestFilters
): Promise<ProcurementRequest[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.department) params.set('department', filters.department);
  if (filters?.search) params.set('search', filters.search);

  const response = await fetch(buildUrl('/requests', params), {
    cache: 'no-store',
  });

  return handleApiResponse<ProcurementRequest[]>(response);
}

export async function getProcurementRequest(
  id: string
): Promise<ProcurementRequest> {
  const response = await fetch(buildUrl(`/requests/${encodeURIComponent(id)}`), {
    cache: 'no-store',
  });

  return handleApiResponse<ProcurementRequest>(response);
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus
): Promise<ProcurementRequest> {
  const response = await fetch(
    buildUrl(`/requests/${encodeURIComponent(id)}/status`),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      cache: 'no-store',
    }
  );

  return handleApiResponse<ProcurementRequest>(response);
}

export async function parseOffer(file: File): Promise<OfferExtractionResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(buildUrl('/offers/parse'), {
    method: 'POST',
    body: formData,
    cache: 'no-store',
  });

  return handleApiResponse<OfferExtractionResult>(response);
}
