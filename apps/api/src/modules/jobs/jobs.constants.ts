/**
 * Background Jobs Constants
 * Queue-based async task execution
 */
import { createPermission } from '@school-erp/shared';

// Permissions
export const JOBS_PERMISSIONS = {
    READ: createPermission('jobs', 'read', 'tenant'),
    RETRY: createPermission('jobs', 'retry', 'tenant'),
} as const;

// Job Types
export const JOB_TYPE = {
    NOTIFICATION_DELIVERY: 'notification.delivery',
    REPORT_GENERATE: 'report.generate',
    FEE_REMINDER: 'fee.reminder',
} as const;

// Job Status
export const JOB_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    RETRYING: 'retrying',
} as const;

// Queue Names
export const QUEUE_NAME = {
    DEFAULT: 'default',
    NOTIFICATIONS: 'notifications',
    REPORTS: 'reports',
    REMINDERS: 'reminders',
} as const;

// Default Configuration
export const JOB_DEFAULTS = {
    CONCURRENCY: 5,
    MAX_RETRY: 3,
    BACKOFF_SECONDS: 30,
    JOB_TIMEOUT_MS: 60000, // 1 minute
} as const;

// Error Codes
export const JOBS_ERROR_CODES = {
    JOB_NOT_FOUND: 'JOB_NOT_FOUND',
    JOBS_DISABLED: 'JOBS_DISABLED',
    CROSS_TENANT_FORBIDDEN: 'CROSS_TENANT_FORBIDDEN',
    MAX_RETRIES_EXCEEDED: 'MAX_RETRIES_EXCEEDED',
    QUEUE_ERROR: 'QUEUE_ERROR',
    PROCESSOR_NOT_FOUND: 'PROCESSOR_NOT_FOUND',
} as const;
