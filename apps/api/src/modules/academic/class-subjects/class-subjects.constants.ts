/**
 * Class-Subjects Sub-module Constants
 */
import { PERMISSIONS } from '@school-erp/shared';

// Reuse class permissions for class-subject operations
export const CLASS_SUBJECT_PERMISSIONS = {
    ASSIGN: PERMISSIONS.CLASS.UPDATE, // Assign/remove subjects requires class update permission
    READ: PERMISSIONS.CLASS.READ,
} as const;

export const CLASS_SUBJECT_ERROR_CODES = {
    CLASS_NOT_FOUND: 'CLASS_NOT_FOUND',
    SUBJECT_NOT_FOUND: 'SUBJECT_NOT_FOUND',
    ALREADY_ASSIGNED: 'SUBJECT_ALREADY_ASSIGNED',
    NOT_ASSIGNED: 'SUBJECT_NOT_ASSIGNED',
    HAS_DEPENDENCIES: 'CLASS_SUBJECT_HAS_DEPENDENCIES',
    SUBJECT_DELETED: 'SUBJECT_DELETED',
    CLASS_DELETED: 'CLASS_DELETED',
} as const;
