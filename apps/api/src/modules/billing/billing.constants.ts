/**
 * Billing Module Constants
 * Razorpay integration configuration
 */
import { createPermission } from '@school-erp/shared';

// Permissions
export const BILLING_PERMISSIONS = {
    CREATE_ORDER: createPermission('subscription', 'update', 'tenant'),
} as const;

// Provider
export const BILLING_PROVIDER = {
    RAZORPAY: 'razorpay',
} as const;

// Payment Statuses
export const PAYMENT_STATUS = {
    CREATED: 'created',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
} as const;

// Razorpay Events
export const RAZORPAY_EVENTS = {
    PAYMENT_CAPTURED: 'payment.captured',
    PAYMENT_FAILED: 'payment.failed',
} as const;

// Error Codes
export const BILLING_ERROR_CODES = {
    ORDER_CREATION_FAILED: 'ORDER_CREATION_FAILED',
    PLAN_NOT_PAYABLE: 'PLAN_NOT_PAYABLE',
    SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
    PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
    INVALID_SIGNATURE: 'INVALID_WEBHOOK_SIGNATURE',
    AMOUNT_MISMATCH: 'AMOUNT_MISMATCH',
    DUPLICATE_PAYMENT: 'DUPLICATE_PAYMENT',
    PROVIDER_ERROR: 'PROVIDER_ERROR',
} as const;

// Currency
export const CURRENCY = {
    INR: 'INR',
} as const;
