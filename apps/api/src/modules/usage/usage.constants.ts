/**
 * Usage Metering Constants
 */

// Usage metrics (matches Prisma enum)
export const USAGE_METRICS = {
    STUDENTS: 'students',
    STAFF: 'staff',
    BRANCHES: 'branches',
    STORAGE_MB: 'storage_mb',
    NOTIFICATIONS: 'notifications',
} as const;

export type UsageMetricType = typeof USAGE_METRICS[keyof typeof USAGE_METRICS];

// Metric to config limit key mapping
export const METRIC_TO_LIMIT_KEY: Record<string, string> = {
    [USAGE_METRICS.STUDENTS]: 'limits.maxStudents',
    [USAGE_METRICS.STAFF]: 'limits.maxStaff',
    [USAGE_METRICS.BRANCHES]: 'limits.maxBranches',
    [USAGE_METRICS.STORAGE_MB]: 'limits.storageGb',
    [USAGE_METRICS.NOTIFICATIONS]: 'limits.maxNotifications',
} as const;

// Usage sources (for audit trail)
export const USAGE_SOURCES = {
    STUDENTS_CREATE: 'students.create',
    STUDENTS_DELETE: 'students.delete',
    STAFF_CREATE: 'staff.create',
    STAFF_DELETE: 'staff.delete',
    BRANCHES_CREATE: 'branches.create',
    BRANCHES_DELETE: 'branches.delete',
    FILES_UPLOAD: 'files.upload',
    FILES_DELETE: 'files.delete',
    NOTIFICATIONS_SEND: 'notifications.send',
} as const;

// Permissions
export const USAGE_PERMISSIONS = {
    READ: 'subscription:read:tenant',
} as const;
