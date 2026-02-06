/**
 * Communication Types
 */
import type {
    AnnouncementStatus,
    TargetGroup,
    NotificationType,
    NotificationStatus,
} from './communication.constants';

export interface AnnouncementResponse {
    id: string;
    title: string;
    content: string;
    targetGroup: TargetGroup;
    targetClassId: string | null;
    targetSectionId: string | null;
    status: AnnouncementStatus;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    publishedAt: string | null;
    expiresAt: string | null;
    createdByUserId: string;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationResponse {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, unknown> | null;
    status: NotificationStatus;
    readAt: string | null;
    createdAt: string;
}

export interface NotificationLogResponse {
    id: string;
    notificationId: string;
    channel: 'in_app' | 'email' | 'sms' | 'push';
    status: NotificationStatus;
    attemptedAt: string;
    deliveredAt: string | null;
    errorMessage: string | null;
}

export interface CommunicationContext {
    tenantId: string;
    branchId: string;
    userId: string;
}

export interface CreateAnnouncementInput {
    title: string;
    content: string;
    targetGroup: TargetGroup;
    targetClassId?: string;
    targetSectionId?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    expiresAt?: string;
}

export interface SendNotificationInput {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
}
