/**
 * Exams Module Constants
 */
import { PERMISSIONS } from '@school-erp/shared';

export const EXAM_PERMISSIONS = {
    CREATE: PERMISSIONS.EXAM.CREATE,
    READ: PERMISSIONS.EXAM.READ,
    UPDATE: PERMISSIONS.EXAM.UPDATE,
    PUBLISH: PERMISSIONS.EXAM.PUBLISH,
} as const;

export const EXAM_TYPE = {
    UNIT_TEST: 'unit_test',
    MID_TERM: 'mid_term',
    FINAL: 'final',
    PRACTICAL: 'practical',
} as const;

export type ExamType = (typeof EXAM_TYPE)[keyof typeof EXAM_TYPE];

export const EXAM_TYPE_OPTIONS = [
    EXAM_TYPE.UNIT_TEST,
    EXAM_TYPE.MID_TERM,
    EXAM_TYPE.FINAL,
    EXAM_TYPE.PRACTICAL,
] as const;

export const EXAM_STATUS = {
    DRAFT: 'draft',
    SCHEDULED: 'scheduled',
    LOCKED: 'locked',
    PUBLISHED: 'published',
} as const;

export type ExamStatus = (typeof EXAM_STATUS)[keyof typeof EXAM_STATUS];

export const EXAM_STATUS_OPTIONS = [
    EXAM_STATUS.DRAFT,
    EXAM_STATUS.SCHEDULED,
    EXAM_STATUS.LOCKED,
    EXAM_STATUS.PUBLISHED,
] as const;

export const EXAM_ERROR_CODES = {
    NOT_FOUND: 'EXAM_NOT_FOUND',
    ALREADY_PUBLISHED: 'EXAM_ALREADY_PUBLISHED',
    CANNOT_EDIT_PUBLISHED: 'CANNOT_EDIT_PUBLISHED_EXAM',
    ACADEMIC_YEAR_NOT_FOUND: 'ACADEMIC_YEAR_NOT_FOUND',
    OVERLAP: 'EXAM_SCHEDULE_OVERLAP',
} as const;
