/**
 * Communication Mapper
 */
import type {
    AnnouncementResponse,
    NotificationResponse,
    NotificationLogResponse,
} from './communication.types';
import type {
    AnnouncementStatus,
    TargetGroup,
    NotificationType,
    NotificationStatus,
} from './communication.constants';

type AnnouncementFromDb = {
    id: string;
    title: string;
    content: string;
    targetGroup: string;
    targetClassId: string | null;
    targetSectionId: string | null;
    status: string;
    priority: string;
    publishedAt: Date | null;
    expiresAt: Date | null;
    createdByUserId: string;
    createdAt: Date;
    updatedAt: Date;
};

type NotificationFromDb = {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data: unknown;
    status: string;
    readAt: Date | null;
    createdAt: Date;
};

type NotificationLogFromDb = {
    id: string;
    notificationId: string;
    channel: string;
    status: string;
    attemptedAt: Date;
    deliveredAt: Date | null;
    errorMessage: string | null;
};

export function toAnnouncementResponse(announcement: AnnouncementFromDb): AnnouncementResponse {
    return {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        targetGroup: announcement.targetGroup as TargetGroup,
        targetClassId: announcement.targetClassId,
        targetSectionId: announcement.targetSectionId,
        status: announcement.status as AnnouncementStatus,
        priority: announcement.priority as 'low' | 'normal' | 'high' | 'urgent',
        publishedAt: announcement.publishedAt?.toISOString() || null,
        expiresAt: announcement.expiresAt?.toISOString().split('T')[0] || null,
        createdByUserId: announcement.createdByUserId,
        createdAt: announcement.createdAt.toISOString(),
        updatedAt: announcement.updatedAt.toISOString(),
    };
}

export function toNotificationResponse(notification: NotificationFromDb): NotificationResponse {
    return {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as NotificationType,
        title: notification.title,
        message: notification.message,
        data: notification.data as Record<string, unknown> | null,
        status: notification.status as NotificationStatus,
        readAt: notification.readAt?.toISOString() || null,
        createdAt: notification.createdAt.toISOString(),
    };
}

export function toNotificationLogResponse(log: NotificationLogFromDb): NotificationLogResponse {
    return {
        id: log.id,
        notificationId: log.notificationId,
        channel: log.channel as 'in_app' | 'email' | 'sms' | 'push',
        status: log.status as NotificationStatus,
        attemptedAt: log.attemptedAt.toISOString(),
        deliveredAt: log.deliveredAt?.toISOString() || null,
        errorMessage: log.errorMessage,
    };
}
