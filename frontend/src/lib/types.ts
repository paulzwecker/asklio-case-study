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
  requestor_name?: string | null;
  vendor_name?: string;
  vendor_vat_id?: string | null;
  department?: string | null;
  title?: string | null;
  order_lines: OrderLine[];
  total_cost?: number | null;
  commodity_group_suggestion?: string | null;
}

// Optional: simple list of commodity groups for selects etc.
export const COMMODITY_GROUPS: string[] = [
  // General Services
  'General Services - Accommodation Rentals',
  'General Services - Membership Fees',
  'General Services - Workplace Safety',
  'General Services - Consulting',
  'General Services - Financial Services',
  'General Services - Fleet Management',
  'General Services - Recruitment Services',
  'General Services - Professional Development',
  'General Services - Miscellaneous Services',
  'General Services - Insurance',

  // Facility Management
  'Facility Management - Electrical Engineering',
  'Facility Management - Facility Management Services',
  'Facility Management - Security',
  'Facility Management - Renovations',
  'Facility Management - Office Equipment',
  'Facility Management - Energy Management',
  'Facility Management - Maintenance',
  'Facility Management - Cafeteria and Kitchenettes',
  'Facility Management - Cleaning',

  // Publishing Production
  'Publishing Production - Audio and Visual Production',
  'Publishing Production - Books/Videos/CDs',
  'Publishing Production - Printing Costs',
  'Publishing Production - Software Development for Publishing',
  'Publishing Production - Material Costs',
  'Publishing Production - Shipping for Production',
  'Publishing Production - Digital Product Development',
  'Publishing Production - Pre-production',
  'Publishing Production - Post-production Costs',

  // Information Technology
  'Information Technology - Hardware',
  'Information Technology - IT Services',
  'Information Technology - Software',

  // Logistics
  'Logistics - Courier, Express, and Postal Services',
  'Logistics - Warehousing and Material Handling',
  'Logistics - Transportation Logistics',
  'Logistics - Delivery Services',

  // Marketing & Advertising
  'Marketing & Advertising - Advertising',
  'Marketing & Advertising - Outdoor Advertising',
  'Marketing & Advertising - Marketing Agencies',
  'Marketing & Advertising - Direct Mail',
  'Marketing & Advertising - Customer Communication',
  'Marketing & Advertising - Online Marketing',
  'Marketing & Advertising - Events',
  'Marketing & Advertising - Promotional Materials',

  // Production
  'Production - Warehouse and Operational Equipment',
  'Production - Production Machinery',
  'Production - Spare Parts',
  'Production - Internal Transportation',
  'Production - Production Materials',
  'Production - Consumables',
  'Production - Maintenance and Repairs',

  // Catch-all
  'Other',
];
