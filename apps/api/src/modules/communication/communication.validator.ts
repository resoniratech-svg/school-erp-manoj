/**
 * Communication Validators
 */
import { z } from 'zod';
import { TARGET_GROUP_OPTIONS, NOTIFICATION_TYPE } from './communication.constants';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Announcement schemas
export const createAnnouncementSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required').max(200),
        content: z.string().min(1, 'Content is required').max(5000),
        targetGroup: z.enum(TARGET_GROUP_OPTIONS as [string, ...string[]]),
        targetClassId: z.string().uuid().optional(),
        targetSectionId: z.string().uuid().optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
        expiresAt: z.string().regex(dateRegex).optional(),
    }).strict().refine(
        (data) => {
            if (data.targetGroup === 'class' && !data.targetClassId) {
                return false;
            }
            if (data.targetGroup === 'section' && !data.targetSectionId) {
                return false;
            }
            return true;
        },
        { message: 'Target class/section required for class/section targeting' }
    ),
});

export const updateAnnouncementSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid announcement ID'),
    }),
    body: z.object({
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).max(5000).optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
        expiresAt: z.string().regex(dateRegex).nullable().optional(),
    }).strict(),
});

export const announcementIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid announcement ID'),
    }),
});

export const listAnnouncementsSchema = z.object({
    query: z.object({
        status: z.enum(['draft', 'published', 'archived']).optional(),
        targetGroup: z.enum(TARGET_GROUP_OPTIONS as [string, ...string[]]).optional(),
    }),
});

// Notification schemas
export const sendNotificationSchema = z.object({
    body: z.object({
        userId: z.string().uuid('Invalid user ID'),
        type: z.enum(Object.values(NOTIFICATION_TYPE) as [string, ...string[]]),
        title: z.string().min(1).max(200),
        message: z.string().min(1).max(1000),
        data: z.record(z.unknown()).optional(),
    }).strict(),
});

export const bulkSendNotificationSchema = z.object({
    body: z.object({
        userIds: z.array(z.string().uuid()).min(1),
        type: z.enum(Object.values(NOTIFICATION_TYPE) as [string, ...string[]]),
        title: z.string().min(1).max(200),
        message: z.string().min(1).max(1000),
        data: z.record(z.unknown()).optional(),
    }).strict(),
});

export const notificationIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid notification ID'),
    }),
});

export const listNotificationsSchema = z.object({
    query: z.object({
        userId: z.string().uuid().optional(),
        type: z.enum(Object.values(NOTIFICATION_TYPE) as [string, ...string[]]).optional(),
        status: z.enum(['pending', 'sent', 'failed', 'read']).optional(),
    }),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>['body'];
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>['body'];
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>['body'];
export type BulkSendNotificationInput = z.infer<typeof bulkSendNotificationSchema>['body'];
