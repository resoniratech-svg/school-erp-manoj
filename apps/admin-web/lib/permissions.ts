/**
 * Permission Utilities
 */

import type { User } from '@school-erp/api-client';

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;
    return user.permissions.includes(permission);
}

/**
 * Check if user has any of the permissions
 */
export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
    if (!user) return false;
    return permissions.some((p) => user.permissions.includes(p));
}

/**
 * Check if user has all of the permissions
 */
export function hasAllPermissions(user: User | null, permissions: string[]): boolean {
    if (!user) return false;
    return permissions.every((p) => user.permissions.includes(p));
}

/**
 * Common permission patterns
 */
export const PERMISSIONS = {
    // Users
    USER_VIEW: 'user:read:tenant',
    USER_CREATE: 'user:create:tenant',
    USER_UPDATE: 'user:update:tenant',
    USER_DELETE: 'user:delete:tenant',

    // Academic
    ACADEMIC_VIEW: 'academic:read:tenant',
    ACADEMIC_MANAGE: 'academic:write:tenant',

    // Fees
    FEES_VIEW: 'fees:read:tenant',
    FEES_MANAGE: 'fees:write:tenant',

    // Attendance
    ATTENDANCE_VIEW: 'attendance:read:tenant',
    ATTENDANCE_MARK: 'attendance:write:tenant',

    // Exams
    EXAMS_VIEW: 'exams:read:tenant',
    EXAMS_MANAGE: 'exams:write:tenant',

    // Reports
    REPORTS_VIEW: 'reports:read:tenant',
    REPORTS_GENERATE: 'reports:generate:tenant',

    // Config
    CONFIG_VIEW: 'config:read:tenant',
    CONFIG_MANAGE: 'config:write:tenant',

    // Audit
    AUDIT_VIEW: 'audit:read:tenant',
} as const;
