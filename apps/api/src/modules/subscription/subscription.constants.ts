/**
 * Subscription Module Constants
 * India-first SaaS billing-ready configuration
 */
import { createPermission } from '@school-erp/shared';

// Permissions
export const SUBSCRIPTION_PERMISSIONS = {
    READ: createPermission('subscription', 'read', 'tenant'),
    UPDATE: createPermission('subscription', 'update', 'tenant'),
} as const;

// Plan Codes
export const PLAN_CODES = {
    FREE: 'FREE',
    BASIC: 'BASIC',
    PRO: 'PRO',
    ENTERPRISE: 'ENTERPRISE',
} as const;

// Trial Configuration
export const TRIAL_CONFIG = {
    DURATION_DAYS: 14,
    DEFAULT_PLAN: PLAN_CODES.FREE,
} as const;

// Plan Pricing (in paise - India first)
export const PLAN_PRICING = {
    [PLAN_CODES.FREE]: 0,
    [PLAN_CODES.BASIC]: 149900,      // ₹1,499
    [PLAN_CODES.PRO]: 399900,        // ₹3,999
    [PLAN_CODES.ENTERPRISE]: 0,       // Custom pricing
} as const;

// Plan-specific config defaults (applied via configService)
// Source of truth for feature flags and limits per plan
export const PLAN_CONFIGS: Record<string, Record<string, boolean | number | string>> = {
    [PLAN_CODES.FREE]: {
        'fees.enabled': false,
        'transport.enabled': false,
        'library.enabled': false,
        'reports.enabled': false,
        'limits.maxStudents': 50,
        'limits.maxStaff': 10,
        'limits.maxBranches': 1,
        'limits.storageGb': 1,
    },
    [PLAN_CODES.BASIC]: {
        'fees.enabled': true,
        'transport.enabled': true,
        'library.enabled': true,
        'reports.enabled': true,
        'limits.maxStudents': 300,
        'limits.maxStaff': 30,
        'limits.maxBranches': 2,
        'limits.storageGb': 5,
    },
    [PLAN_CODES.PRO]: {
        'fees.enabled': true,
        'transport.enabled': true,
        'library.enabled': true,
        'reports.enabled': true,
        'timetable.enabled': true,
        'limits.maxStudents': 1000,
        'limits.maxStaff': 100,
        'limits.maxBranches': 5,
        'limits.storageGb': 25,
    },
    [PLAN_CODES.ENTERPRISE]: {
        'fees.enabled': true,
        'transport.enabled': true,
        'library.enabled': true,
        'reports.enabled': true,
        'timetable.enabled': true,
        'limits.maxStudents': 10000,
        'limits.maxStaff': 500,
        'limits.maxBranches': 50,
        'limits.storageGb': 100,
    },
} as const;

// Error Codes
export const SUBSCRIPTION_ERROR_CODES = {
    NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
    PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
    PLAN_INACTIVE: 'PLAN_INACTIVE',
    ALREADY_EXISTS: 'SUBSCRIPTION_ALREADY_EXISTS',
    CANNOT_DOWNGRADE: 'CANNOT_DOWNGRADE',
    CROSS_TENANT_FORBIDDEN: 'SUBSCRIPTION_CROSS_TENANT_FORBIDDEN',
} as const;

// Subscription Statuses
export const SUBSCRIPTION_STATUS = {
    TRIALING: 'trialing',
    ACTIVE: 'active',
    PAST_DUE: 'past_due',
    SUSPENDED: 'suspended',
    CANCELLED: 'cancelled',
} as const;
