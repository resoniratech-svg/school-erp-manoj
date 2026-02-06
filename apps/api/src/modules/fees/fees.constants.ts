/**
 * Fees Module Constants
 * CRITICAL: Financial module - audit-safe operations only
 */
import { PERMISSIONS } from '@school-erp/shared';

export const FEE_STRUCTURE_PERMISSIONS = {
    CREATE: PERMISSIONS.FEE_STRUCTURE.CREATE,
    READ: PERMISSIONS.FEE_STRUCTURE.READ,
    UPDATE: PERMISSIONS.FEE_STRUCTURE.UPDATE,
} as const;

export const FEE_ASSIGNMENT_PERMISSIONS = {
    CREATE: PERMISSIONS.FEE_ASSIGN.CREATE,
    READ: PERMISSIONS.FEE_ASSIGN.READ,
} as const;

export const FEE_PAYMENT_PERMISSIONS = {
    RECORD: PERMISSIONS.FEE_PAYMENT.RECORD,
    READ: PERMISSIONS.FEE_PAYMENT.READ,
} as const;

export const FEE_REPORT_PERMISSIONS = {
    READ: PERMISSIONS.FEE_REPORT.READ,
} as const;

export const FEE_TYPE = {
    TUITION: 'tuition',
    TRANSPORT: 'transport',
    LAB: 'lab',
    LIBRARY: 'library',
    SPORTS: 'sports',
    EXAM: 'exam',
    ADMISSION: 'admission',
    OTHER: 'other',
} as const;

export type FeeType = (typeof FEE_TYPE)[keyof typeof FEE_TYPE];

export const FEE_TYPE_OPTIONS = Object.values(FEE_TYPE);

export const INSTALLMENT_FREQUENCY = {
    ONE_TIME: 'one_time',
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    HALF_YEARLY: 'half_yearly',
    YEARLY: 'yearly',
} as const;

export type InstallmentFrequency = (typeof INSTALLMENT_FREQUENCY)[keyof typeof INSTALLMENT_FREQUENCY];

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PARTIAL: 'partial',
    PAID: 'paid',
    OVERDUE: 'overdue',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_MODE = {
    CASH: 'cash',
    CHEQUE: 'cheque',
    BANK_TRANSFER: 'bank_transfer',
    UPI: 'upi',
    CARD: 'card',
    OTHER: 'other',
} as const;

export type PaymentMode = (typeof PAYMENT_MODE)[keyof typeof PAYMENT_MODE];

export const FEES_ERROR_CODES = {
    STRUCTURE_NOT_FOUND: 'FEE_STRUCTURE_NOT_FOUND',
    ASSIGNMENT_NOT_FOUND: 'FEE_ASSIGNMENT_NOT_FOUND',
    PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
    DUPLICATE_ASSIGNMENT: 'DUPLICATE_FEE_ASSIGNMENT',
    OVERPAYMENT: 'PAYMENT_EXCEEDS_BALANCE',
    STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND',
    ACADEMIC_YEAR_NOT_FOUND: 'ACADEMIC_YEAR_NOT_FOUND',
    INVALID_AMOUNT: 'INVALID_PAYMENT_AMOUNT',
    DUPLICATE_RECEIPT: 'DUPLICATE_RECEIPT_NUMBER',
    CANNOT_DELETE_PAYMENT: 'CANNOT_DELETE_PAYMENT',
} as const;
