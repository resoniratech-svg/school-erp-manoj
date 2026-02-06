/**
 * Credit Notes Constants
 */

// Credit note statuses
export const CREDIT_NOTE_STATUS = {
    ISSUED: 'issued',
    APPLIED: 'applied',
} as const;

// Credit reasons
export const CREDIT_REASON = {
    OVERBILLING: 'overbilling',
    PLAN_DOWNGRADE: 'plan_downgrade',
    REFUND: 'refund',
    GST_CORRECTION: 'gst_correction',
    CANCELLATION: 'cancellation',
} as const;

// Reason labels for UI
export const CREDIT_REASON_LABELS: Record<string, string> = {
    [CREDIT_REASON.OVERBILLING]: 'Overbilling Correction',
    [CREDIT_REASON.PLAN_DOWNGRADE]: 'Plan Downgrade',
    [CREDIT_REASON.REFUND]: 'Refund',
    [CREDIT_REASON.GST_CORRECTION]: 'GST Correction',
    [CREDIT_REASON.CANCELLATION]: 'Cancellation',
};

// Permissions
export const CREDIT_NOTE_PERMISSIONS = {
    READ: 'credit_note:read:tenant',
    CREATE: 'credit_note:create:tenant',
} as const;

// Error codes
export const CREDIT_NOTE_ERROR_CODES = {
    NOT_FOUND: 'CREDIT_NOTE_NOT_FOUND',
    INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',
    OVER_CREDIT: 'CREDIT_EXCEEDS_INVOICE',
    ALREADY_APPLIED: 'CREDIT_NOTE_ALREADY_APPLIED',
    INVALID_INVOICE_STATUS: 'INVOICE_NOT_ISSUED_OR_PAID',
} as const;
