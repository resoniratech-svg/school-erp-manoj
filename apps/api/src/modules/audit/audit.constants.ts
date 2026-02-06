/**
 * Audit Module Constants
 * READ-ONLY module - NO delete, NO update
 */
import { createPermission } from '@school-erp/shared';

// Permissions
export const AUDIT_PERMISSIONS = {
    READ_TENANT: createPermission('audit', 'read', 'tenant'),
    READ_BRANCH: createPermission('audit', 'read', 'branch'),
} as const;

// Actions that can be audited
export const AUDIT_ACTION = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    VIEW: 'view',
    EXPORT: 'export',
    PUBLISH: 'publish',
    APPROVE: 'approve',
    REJECT: 'reject',
    ISSUE: 'issue',
    RETURN: 'return',
    PAYMENT: 'payment',
    ASSIGN: 'assign',
    UNASSIGN: 'unassign',
} as const;

// Modules that generate audit logs
export const AUDIT_MODULE = {
    AUTH: 'auth',
    USERS: 'users',
    ROLES: 'roles',
    ACADEMIC: 'academic',
    TIMETABLE: 'timetable',
    ATTENDANCE: 'attendance',
    EXAMS: 'exams',
    REPORTS: 'reports',
    FEES: 'fees',
    COMMUNICATION: 'communication',
    TRANSPORT: 'transport',
    LIBRARY: 'library',
    SYSTEM: 'system',
} as const;

// Sensitive fields to mask
export const SENSITIVE_FIELDS = [
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'privateKey',
    'creditCard',
    'cvv',
    'ssn',
    'otp',
    'pin',
] as const;

// Mask pattern
export const MASK_PATTERN = '********';

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 100,
} as const;

// Error Codes
export const AUDIT_ERROR_CODES = {
    LOG_NOT_FOUND: 'AUDIT_LOG_NOT_FOUND',
    CROSS_TENANT_FORBIDDEN: 'CROSS_TENANT_FORBIDDEN',
    INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
} as const;
