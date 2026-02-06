/**
 * Accounting Constants
 * READ-ONLY exports - NO write operations
 */

// Export formats
export const EXPORT_FORMAT = {
    JSON: 'json',
    CSV: 'csv',
    TALLY: 'tally',
    ZOHO: 'zoho',
} as const;

// Report types
export const REPORT_TYPE = {
    GST_SUMMARY: 'gst_summary',
    INVOICE_REGISTER: 'invoice_register',
    CREDIT_NOTE_REGISTER: 'credit_note_register',
    PAYMENT_REGISTER: 'payment_register',
    REVENUE_SUMMARY: 'revenue_summary',
    RECEIVABLES: 'receivables',
} as const;

// GST sections
export const GST_SECTIONS = {
    CGST: 'cgst',
    SGST: 'sgst',
    IGST: 'igst',
} as const;

// Permissions (READ-ONLY)
export const ACCOUNTING_PERMISSIONS = {
    READ: 'accounting:read:tenant',
    EXPORT: 'accounting:export:tenant',
} as const;

// CSV headers for exports
export const CSV_HEADERS = {
    INVOICE: [
        'Invoice Number',
        'Invoice Date',
        'Customer GSTIN',
        'Place of Supply',
        'Taxable Amount',
        'CGST',
        'SGST',
        'IGST',
        'Total Amount',
        'Status',
    ],
    CREDIT_NOTE: [
        'Credit Note Number',
        'Invoice Number',
        'Issue Date',
        'Reason',
        'Taxable Amount',
        'CGST',
        'SGST',
        'IGST',
        'Total Credit',
    ],
    PAYMENT: [
        'Payment ID',
        'Invoice Number',
        'Amount',
        'Provider',
        'Date',
        'Status',
    ],
    GST_SUMMARY: [
        'Month',
        'Taxable Value',
        'CGST',
        'SGST',
        'IGST',
        'Credit Notes',
        'Net GST',
    ],
};
