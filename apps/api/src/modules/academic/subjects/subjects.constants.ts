/**
 * Subjects Sub-module Constants
 */
import { PERMISSIONS } from '@school-erp/shared';

export const SUBJECT_PERMISSIONS = {
    CREATE: PERMISSIONS.SUBJECT.CREATE,
    READ: PERMISSIONS.SUBJECT.READ,
    UPDATE: PERMISSIONS.SUBJECT.UPDATE,
    DELETE: PERMISSIONS.SUBJECT.DELETE,
} as const;

export const SUBJECT_ERROR_CODES = {
    NOT_FOUND: 'SUBJECT_NOT_FOUND',
    CODE_ALREADY_EXISTS: 'SUBJECT_CODE_ALREADY_EXISTS',
    NAME_ALREADY_EXISTS: 'SUBJECT_NAME_ALREADY_EXISTS',
    HAS_DEPENDENCIES: 'SUBJECT_HAS_DEPENDENCIES',
    ALREADY_DELETED: 'SUBJECT_ALREADY_DELETED',
} as const;

export const SUBJECT_TYPE_OPTIONS = ['core', 'elective', 'language', 'activity'] as const;
export type SubjectType = (typeof SUBJECT_TYPE_OPTIONS)[number];

export const PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100,
} as const;
