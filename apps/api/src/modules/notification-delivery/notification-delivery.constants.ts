/**
 * Notification Delivery Constants
 * Append-only, config-driven, vendor-agnostic
 */
import { createPermission } from '@school-erp/shared';

// Permissions
export const DELIVERY_PERMISSIONS = {
    READ: createPermission('notification_delivery', 'read', 'tenant'),
    RETRY: createPermission('notification_delivery', 'retry', 'tenant'),
} as const;

// Delivery Channels
export const DELIVERY_CHANNEL = {
    EMAIL: 'email',
    SMS: 'sms',
    WHATSAPP: 'whatsapp',
} as const;

// Delivery Status
export const DELIVERY_STATUS = {
    PENDING: 'pending',
    SENT: 'sent',
    FAILED: 'failed',
} as const;

// Email Providers
export const EMAIL_PROVIDER = {
    SMTP: 'smtp',
    SES: 'ses',
} as const;

// SMS Providers
export const SMS_PROVIDER = {
    TWILIO: 'twilio',
    MSG91: 'msg91',
} as const;

// WhatsApp Providers
export const WHATSAPP_PROVIDER = {
    META: 'meta',
} as const;

// Default Configuration
export const DELIVERY_DEFAULTS = {
    MAX_RETRY_COUNT: 3,
    RETRY_DELAY_MS: 5000,
} as const;

// Error Codes
export const DELIVERY_ERROR_CODES = {
    DELIVERY_NOT_FOUND: 'DELIVERY_NOT_FOUND',
    PROVIDER_NOT_CONFIGURED: 'PROVIDER_NOT_CONFIGURED',
    PROVIDER_FAILED: 'PROVIDER_FAILED',
    MAX_RETRIES_EXCEEDED: 'MAX_RETRIES_EXCEEDED',
    CROSS_TENANT_FORBIDDEN: 'CROSS_TENANT_FORBIDDEN',
    CHANNEL_DISABLED: 'CHANNEL_DISABLED',
} as const;

// Sensitive fields to mask in logs
export const SENSITIVE_PAYLOAD_FIELDS = [
    'password',
    'otp',
    'token',
    'pin',
    'secret',
] as const;
