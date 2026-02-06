/**
 * System Config & Feature Flags Constants
 * NO DELETE - UPSERT ONLY
 */
import { createPermission } from '@school-erp/shared';

// Permissions
export const CONFIG_PERMISSIONS = {
    READ: createPermission('config', 'read', 'tenant'),
    UPDATE: createPermission('config', 'update', 'tenant'),
} as const;

// Config Scopes
export const CONFIG_SCOPE = {
    TENANT: 'TENANT',
    BRANCH: 'BRANCH',
} as const;

// Config Value Types
export const CONFIG_VALUE_TYPE = {
    BOOLEAN: 'boolean',
    NUMBER: 'number',
    STRING: 'string',
    ENUM: 'enum',
} as const;

// Allowed Config Keys (Whitelist)
export const ALLOWED_CONFIG_KEYS = {
    // Feature Flags - Modules
    'attendance.enabled': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'exams.enabled': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'fees.enabled': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'transport.enabled': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'library.enabled': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'communication.enabled': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'reports.enabled': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'timetable.enabled': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },

    // Limits
    'limits.maxStudents': { type: CONFIG_VALUE_TYPE.NUMBER, default: 1000 },
    'limits.maxStaff': { type: CONFIG_VALUE_TYPE.NUMBER, default: 100 },
    'limits.maxBranches': { type: CONFIG_VALUE_TYPE.NUMBER, default: 5 },
    'limits.maxUsersPerBranch': { type: CONFIG_VALUE_TYPE.NUMBER, default: 50 },
    'limits.storageGb': { type: CONFIG_VALUE_TYPE.NUMBER, default: 10 },

    // Policies
    'attendance.correctionAllowed': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'attendance.correctionWindowDays': { type: CONFIG_VALUE_TYPE.NUMBER, default: 7 },
    'fees.partialPaymentAllowed': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'fees.lateFeePercentage': { type: CONFIG_VALUE_TYPE.NUMBER, default: 5 },
    'reports.attendanceThreshold': { type: CONFIG_VALUE_TYPE.NUMBER, default: 75 },
    'library.maxBooksPerStudent': { type: CONFIG_VALUE_TYPE.NUMBER, default: 3 },
    'library.issueDurationDays': { type: CONFIG_VALUE_TYPE.NUMBER, default: 14 },
    'library.finePerDay': { type: CONFIG_VALUE_TYPE.NUMBER, default: 5 },
    'exams.passingPercentage': { type: CONFIG_VALUE_TYPE.NUMBER, default: 40 },
    'exams.gradePublishAllowed': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },

    // Rate Limiting
    'rate.limit.enabled': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'rate.limit.tenant.perMinute': { type: CONFIG_VALUE_TYPE.NUMBER, default: 1000 },
    'rate.limit.user.perMinute': { type: CONFIG_VALUE_TYPE.NUMBER, default: 100 },
    'rate.limit.ip.perMinute': { type: CONFIG_VALUE_TYPE.NUMBER, default: 60 },
    'rate.limit.auth.login.perMinute': { type: CONFIG_VALUE_TYPE.NUMBER, default: 5 },
    'rate.limit.auth.passwordReset.perHour': { type: CONFIG_VALUE_TYPE.NUMBER, default: 3 },
    'rate.limit.blockDurationSeconds': { type: CONFIG_VALUE_TYPE.NUMBER, default: 60 },

    // File Storage
    'files.maxUploadMb': { type: CONFIG_VALUE_TYPE.NUMBER, default: 10 },
    'files.signedUrlExpirySeconds': { type: CONFIG_VALUE_TYPE.NUMBER, default: 3600 },
    'files.storageProvider': { type: CONFIG_VALUE_TYPE.STRING, default: 'local' },

    // Notification Delivery
    'notification.email.provider': { type: CONFIG_VALUE_TYPE.STRING, default: 'smtp' },
    'notification.email.enabled': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'notification.sms.provider': { type: CONFIG_VALUE_TYPE.STRING, default: 'twilio' },
    'notification.sms.enabled': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'notification.whatsapp.provider': { type: CONFIG_VALUE_TYPE.STRING, default: 'meta' },
    'notification.whatsapp.enabled': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'notification.maxRetryCount': { type: CONFIG_VALUE_TYPE.NUMBER, default: 3 },

    // Background Jobs
    'jobs.enabled': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: true },
    'jobs.concurrency': { type: CONFIG_VALUE_TYPE.NUMBER, default: 5 },
    'jobs.maxRetry': { type: CONFIG_VALUE_TYPE.NUMBER, default: 3 },
    'jobs.backoffSeconds': { type: CONFIG_VALUE_TYPE.NUMBER, default: 30 },

    // System
    'system.maintenanceMode': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: false },
    'system.debugMode': { type: CONFIG_VALUE_TYPE.BOOLEAN, default: false },
    'system.timezone': { type: CONFIG_VALUE_TYPE.STRING, default: 'Asia/Kolkata' },
    'system.dateFormat': { type: CONFIG_VALUE_TYPE.STRING, default: 'DD/MM/YYYY' },
} as const;

// Error Codes
export const CONFIG_ERROR_CODES = {
    INVALID_KEY: 'CONFIG_INVALID_KEY',
    INVALID_VALUE_TYPE: 'CONFIG_INVALID_VALUE_TYPE',
    CROSS_TENANT_FORBIDDEN: 'CONFIG_CROSS_TENANT_FORBIDDEN',
    NOT_FOUND: 'CONFIG_NOT_FOUND',
} as const;

// Pagination
export const CONFIG_PAGINATION = {
    DEFAULT_LIMIT: 100,
    MAX_LIMIT: 500,
} as const;
