/**
 * Communication Module Constants
 */
import { PERMISSIONS } from '@school-erp/shared';

export const ANNOUNCEMENT_PERMISSIONS = {
    CREATE: PERMISSIONS.ANNOUNCEMENT.CREATE,
    READ: PERMISSIONS.ANNOUNCEMENT.READ,
    PUBLISH: PERMISSIONS.ANNOUNCEMENT.PUBLISH,
} as const;

export const NOTIFICATION_PERMISSIONS = {
    SEND: PERMISSIONS.NOTIFICATION.SEND,
    READ: PERMISSIONS.NOTIFICATION.READ,
} as const;

export const ANNOUNCEMENT_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
} as const;

export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUS)[keyof typeof ANNOUNCEMENT_STATUS];

export const TARGET_GROUP = {
    ALL: 'all',
    STUDENTS: 'students',
    PARENTS: 'parents',
    STAFF: 'staff',
    CLASS: 'class',
    SECTION: 'section',
} as const;

export type TargetGroup = (typeof TARGET_GROUP)[keyof typeof TARGET_GROUP];

export const TARGET_GROUP_OPTIONS = Object.values(TARGET_GROUP);

export const NOTIFICATION_TYPE = {
    FEE_OVERDUE: 'fee_overdue',
    ATTENDANCE_ALERT: 'attendance_alert',
    EXAM_PUBLISHED: 'exam_published',
    RESULT_PUBLISHED: 'result_published',
    ANNOUNCEMENT: 'announcement',
    GENERAL: 'general',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_STATUS = {
    PENDING: 'pending',
    SENT: 'sent',
    FAILED: 'failed',
    READ: 'read',
} as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

export const COMMUNICATION_ERROR_CODES = {
    ANNOUNCEMENT_NOT_FOUND: 'ANNOUNCEMENT_NOT_FOUND',
    NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
    ALREADY_PUBLISHED: 'ANNOUNCEMENT_ALREADY_PUBLISHED',
    CANNOT_EDIT_PUBLISHED: 'CANNOT_EDIT_PUBLISHED_ANNOUNCEMENT',
    INVALID_TARGET: 'INVALID_TARGET_GROUP',
} as const;
