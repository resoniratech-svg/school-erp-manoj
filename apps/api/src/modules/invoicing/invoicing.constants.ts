/**
 * Invoicing Constants
 * GST and billing configuration
 */

// Invoice statuses
export const INVOICE_STATUS = {
    DRAFT: 'draft',
    ISSUED: 'issued',
    PAID: 'paid',
    PARTIALLY_PAID: 'partially_paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled',
} as const;

// Tax types
export const TAX_TYPE = {
    CGST: 'cgst',
    SGST: 'sgst',
    IGST: 'igst',
} as const;

// Invoice item types
export const INVOICE_ITEM_TYPE = {
    SUBSCRIPTION: 'subscription',
    OVERAGE: 'overage',
    ADJUSTMENT: 'adjustment',
} as const;

// GST rates (India)
export const GST_RATES = {
    SAAS: 18, // SaaS services: 18% GST
    CGST: 9,  // Half of total GST
    SGST: 9,  // Half of total GST
    IGST: 18, // Full GST for inter-state
} as const;

// Company details (for invoicing)
export const COMPANY_INFO = {
    NAME: 'School ERP Pvt Ltd',
    GSTIN: '29AABCS1429H1ZK', // Example Karnataka GSTIN
    STATE_CODE: '29', // Karnataka
    STATE_NAME: 'Karnataka',
    ADDRESS: 'Bangalore, Karnataka, India',
    PAN: 'AABCS1429H',
} as const;

// Invoice due days
export const INVOICE_DUE_DAYS = 15;

// Permissions
export const INVOICE_PERMISSIONS = {
    READ: 'invoice:read:tenant',
    GENERATE: 'invoice:generate:tenant',
} as const;

// Error codes
export const INVOICE_ERROR_CODES = {
    NOT_FOUND: 'INVOICE_NOT_FOUND',
    ALREADY_EXISTS: 'INVOICE_ALREADY_EXISTS',
    GENERATION_FAILED: 'INVOICE_GENERATION_FAILED',
    NO_SUBSCRIPTION: 'NO_ACTIVE_SUBSCRIPTION',
} as const;
