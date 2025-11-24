// src/lib/types.ts

export type RequestStatus = 'Open' | 'In Progress' | 'Closed';

export interface OrderLine {
  id?: number;
  position_description: string;
  unit_price: number;
  amount: number;
  unit: string;
  total_price: number;
}

export interface ProcurementRequest {
  id: string;
  requestor_name: string;
  title: string;
  vendor_name: string;
  vendor_vat_id: string;
  department: string;
  order_lines: OrderLine[];
  total_cost: number;
  commodity_group: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface OfferExtractionResult {
  vendor_name?: string;
  vendor_vat_id?: string;
  department?: string;
  title?: string;
  order_lines: OrderLine[];
  total_cost?: number;
  commodity_group_suggestion?: string;
}

// Optional: simple list of commodity groups for selects etc.
export const COMMODITY_GROUPS: string[] = [
  'IT - Software',
  'IT - Hardware',
  'Marketing & Advertising',
  'Logistics',
  'Office Supplies',
  'Professional Services',
];
