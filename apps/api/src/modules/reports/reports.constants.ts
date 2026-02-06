/**
 * Reports Module Constants
 */
import { PERMISSIONS } from '@school-erp/shared';

export const REPORT_PERMISSIONS = {
    GENERATE: PERMISSIONS.REPORT.GENERATE,
    READ: PERMISSIONS.REPORT.READ,
    PUBLISH: PERMISSIONS.REPORT.PUBLISH,
} as const;

export const TRANSCRIPT_PERMISSIONS = {
    READ: PERMISSIONS.TRANSCRIPT.READ,
} as const;

export const REPORT_STATUS = {
    DRAFT: 'draft',
    GENERATED: 'generated',
    PUBLISHED: 'published',
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const RESULT_STATUS = {
    PASS: 'pass',
    FAIL: 'fail',
    WITHHELD: 'withheld',
    PROMOTED: 'promoted',
} as const;

export type ResultStatus = (typeof RESULT_STATUS)[keyof typeof RESULT_STATUS];

export const ATTENDANCE_THRESHOLD_PERCENTAGE = 75;

export const REPORT_ERROR_CODES = {
    NOT_FOUND: 'REPORT_NOT_FOUND',
    STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND',
    EXAM_NOT_PUBLISHED: 'EXAM_NOT_PUBLISHED',
    ALREADY_PUBLISHED: 'REPORT_ALREADY_PUBLISHED',
    CANNOT_MODIFY_PUBLISHED: 'CANNOT_MODIFY_PUBLISHED_REPORT',
    ACADEMIC_YEAR_NOT_FOUND: 'ACADEMIC_YEAR_NOT_FOUND',
    NO_MARKS_FOUND: 'NO_MARKS_FOUND',
} as const;
