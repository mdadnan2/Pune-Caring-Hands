// Phase 1 service base prices in INR (paise not used — stored as integers)
export const SERVICE_BASE_PRICES = {
  DOCTOR_HOME_CONSULTATION: 1500,
  ECG_AT_HOME: 700,
  ONLINE_CONSULTATION: 500,
  // BLOOD_TEST_AT_HOME: item-wise pricing
  // XRAY_AT_HOME: type-wise pricing
  // MEDICINE_HOME_DELIVERY: prescription-based pricing
} as const;

// API prefix
export const API_PREFIX = '/api/v1';
export const ADMIN_API_PREFIX = '/api/v1/admin';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Prescription uploads: keep the frontend and backend on the same accepted formats and limit.
export const UPLOAD_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export const UPLOAD_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Supported Pune PIN codes (Phase 1 — extend as needed)
export const PUNE_CITY = 'Pune';
export const SUPPORTED_STATE = 'Maharashtra';
export const SUPPORTED_COUNTRY = 'India';
