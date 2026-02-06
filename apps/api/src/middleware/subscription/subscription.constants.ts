/**
 * Subscription Enforcement Constants
 */

// Paths allowed when subscription is inactive (past_due, suspended, cancelled)
export const ALLOWED_WHEN_INACTIVE_PATHS = [
    '/api/v1/auth',
    '/api/v1/billing',
    '/api/v1/subscription',
    '/health',
    '/ready',
    '/metrics',
    '/api/v1/observability',
] as const;

// HTTP methods that perform write operations
export const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

// Subscription statuses that block access
export const INACTIVE_STATUSES = ['past_due', 'suspended', 'cancelled'] as const;

// Subscription statuses that allow access
export const ACTIVE_STATUSES = ['trialing', 'active'] as const;

// Error codes
export const ENFORCEMENT_ERROR_CODES = {
    NO_SUBSCRIPTION: 'NO_SUBSCRIPTION',
    SUBSCRIPTION_INACTIVE: 'SUBSCRIPTION_INACTIVE',
    FEATURE_DISABLED: 'FEATURE_DISABLED',
    PLAN_LIMIT_EXCEEDED: 'PLAN_LIMIT_EXCEEDED',
} as const;

// Feature key to path mapping (auto-detect feature from path)
export const PATH_TO_FEATURE_MAP: Record<string, string> = {
    '/api/v1/fees': 'fees.enabled',
    '/api/v1/transport': 'transport.enabled',
    '/api/v1/library': 'library.enabled',
    '/api/v1/attendance': 'attendance.enabled',
    '/api/v1/exams': 'exams.enabled',
    '/api/v1/timetable': 'timetable.enabled',
    '/api/v1/reports': 'reports.enabled',
    '/api/v1/communication': 'communication.enabled',
} as const;

// Limit key to path mapping (auto-detect limit from path)
export const PATH_TO_LIMIT_MAP: Record<string, string> = {
    '/api/v1/students': 'limits.maxStudents',
    '/api/v1/staff': 'limits.maxStaff',
    '/api/v1/branches': 'limits.maxBranches',
} as const;
