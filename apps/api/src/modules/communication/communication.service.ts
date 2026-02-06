/**
 * Communication Service
 */
import {
    NotFoundError,
    BadRequestError,
} from '@school-erp/shared';
import { communicationRepository, CommunicationRepository } from './communication.repository';
import { toAnnouncementResponse, toNotificationResponse } from './communication.mapper';
import {
    COMMUNICATION_ERROR_CODES,
    ANNOUNCEMENT_STATUS,
    NOTIFICATION_TYPE,
} from './communication.constants';
import type {
    AnnouncementResponse,
    NotificationResponse,
    CommunicationContext,
} from './communication.types';
import type {
    CreateAnnouncementInput,
    UpdateAnnouncementInput,
    SendNotificationInput,
    BulkSendNotificationInput,
} from './communication.validator';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

export class CommunicationService {
    constructor(private readonly repository: CommunicationRepository = communicationRepository) { }

    // ==================== ANNOUNCEMENTS ====================

    async createAnnouncement(
        input: CreateAnnouncementInput,
        context: CommunicationContext
    ): Promise<AnnouncementResponse> {
        const announcement = await this.repository.createAnnouncement({
            tenantId: context.tenantId,
            branchId: context.branchId,
            title: input.title,
            content: input.content,
            targetGroup: input.targetGroup,
            targetClassId: input.targetClassId,
            targetSectionId: input.targetSectionId,
            priority: input.priority || 'normal',
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
            createdByUserId: context.userId,
        });

        logger.info('Announcement created', {
            announcementId: announcement.id,
            targetGroup: input.targetGroup,
            createdBy: context.userId,
        });

        return toAnnouncementResponse(announcement);
    }

    async getAnnouncementById(
        id: string,
        context: CommunicationContext
    ): Promise<AnnouncementResponse> {
        const announcement = await this.repository.findAnnouncementById(
            id,
            context.tenantId,
            context.branchId
        );
        if (!announcement) {
            throw new NotFoundError('Announcement not found', {
                code: COMMUNICATION_ERROR_CODES.ANNOUNCEMENT_NOT_FOUND,
            });
        }
        return toAnnouncementResponse(announcement);
    }

    async listAnnouncements(
        filters: { status?: string; targetGroup?: string },
        context: CommunicationContext
    ): Promise<AnnouncementResponse[]> {
        const announcements = await this.repository.findAnnouncements(
            context.tenantId,
            context.branchId,
            filters
        );
        return announcements.map(toAnnouncementResponse);
    }

    async updateAnnouncement(
        id: string,
        input: UpdateAnnouncementInput,
        context: CommunicationContext
    ): Promise<AnnouncementResponse> {
        const existing = await this.repository.findAnnouncementById(
            id,
            context.tenantId,
            context.branchId
        );
        if (!existing) {
            throw new NotFoundError('Announcement not found', {
                code: COMMUNICATION_ERROR_CODES.ANNOUNCEMENT_NOT_FOUND,
            });
        }

        // CRITICAL: Cannot edit published announcements
        if (existing.status === ANNOUNCEMENT_STATUS.PUBLISHED) {
            throw new BadRequestError('Cannot edit published announcement', {
                code: COMMUNICATION_ERROR_CODES.CANNOT_EDIT_PUBLISHED,
            });
        }

        const updated = await this.repository.updateAnnouncement(id, {
            title: input.title,
            content: input.content,
            priority: input.priority,
            expiresAt: input.expiresAt === null ? null : input.expiresAt ? new Date(input.expiresAt) : undefined,
        });

        logger.info('Announcement updated', {
            announcementId: id,
            updatedBy: context.userId,
        });

        return toAnnouncementResponse(updated);
    }

    async publishAnnouncement(
        id: string,
        context: CommunicationContext
    ): Promise<AnnouncementResponse> {
        const existing = await this.repository.findAnnouncementById(
            id,
            context.tenantId,
            context.branchId
        );
        if (!existing) {
            throw new NotFoundError('Announcement not found', {
                code: COMMUNICATION_ERROR_CODES.ANNOUNCEMENT_NOT_FOUND,
            });
        }

        if (existing.status === ANNOUNCEMENT_STATUS.PUBLISHED) {
            throw new BadRequestError('Announcement is already published', {
                code: COMMUNICATION_ERROR_CODES.ALREADY_PUBLISHED,
            });
        }

        const published = await this.repository.publishAnnouncement(id);

        // Send notifications to target group
        await this.notifyAnnouncementTargets(published, context);

        logger.info('Announcement published', {
            announcementId: id,
            publishedBy: context.userId,
        });

        return toAnnouncementResponse(published);
    }

    private async notifyAnnouncementTargets(
        announcement: { id: string; title: string; targetGroup: string; targetClassId: string | null; targetSectionId: string | null },
        context: CommunicationContext
    ): Promise<void> {
        const userIds = await this.repository.findUsersByTargetGroup(
            context.tenantId,
            context.branchId,
            announcement.targetGroup,
            announcement.targetClassId || undefined,
            announcement.targetSectionId || undefined
        );

        if (userIds.length > 0) {
            await this.sendBulkNotification(
                {
                    userIds,
                    type: NOTIFICATION_TYPE.ANNOUNCEMENT,
                    title: 'New Announcement',
                    message: announcement.title,
                    data: { announcementId: announcement.id },
                },
                context
            );
        }
    }

    async archiveAnnouncement(
        id: string,
        context: CommunicationContext
    ): Promise<AnnouncementResponse> {
        const existing = await this.repository.findAnnouncementById(
            id,
            context.tenantId,
            context.branchId
        );
        if (!existing) {
            throw new NotFoundError('Announcement not found', {
                code: COMMUNICATION_ERROR_CODES.ANNOUNCEMENT_NOT_FOUND,
            });
        }

        const archived = await this.repository.archiveAnnouncement(id);

        logger.info('Announcement archived', {
            announcementId: id,
            archivedBy: context.userId,
        });

        return toAnnouncementResponse(archived);
    }

    // ==================== NOTIFICATIONS (APPEND-ONLY) ====================

    async sendNotification(
        input: SendNotificationInput,
        context: CommunicationContext
    ): Promise<NotificationResponse> {
        const notification = await this.repository.createNotification({
            tenantId: context.tenantId,
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            data: input.data,
        });

        // Log delivery attempt (in-app is always successful)
        await this.repository.createNotificationLog({
            notificationId: notification.id,
            channel: 'in_app',
            status: 'sent',
        });

        logger.info('Notification sent', {
            notificationId: notification.id,
            userId: input.userId,
            type: input.type,
        });

        return toNotificationResponse(notification);
    }

    async sendBulkNotification(
        input: BulkSendNotificationInput,
        context: CommunicationContext
    ): Promise<{ sent: number; failed: number }> {
        const notifications = await this.repository.createManyNotifications(
            input.userIds.map((userId) => ({
                tenantId: context.tenantId,
                userId,
                type: input.type,
                title: input.title,
                message: input.message,
                data: input.data,
            }))
        );

        // Log delivery attempts
        for (const notification of notifications) {
            await this.repository.createNotificationLog({
                notificationId: notification.id,
                channel: 'in_app',
                status: 'sent',
            });
        }

        logger.info('Bulk notifications sent', {
            count: notifications.length,
            type: input.type,
        });

        return { sent: notifications.length, failed: 0 };
    }

    async getNotification(
        id: string,
        context: CommunicationContext
    ): Promise<NotificationResponse> {
        const notification = await this.repository.findNotificationById(id, context.tenantId);
        if (!notification) {
            throw new NotFoundError('Notification not found', {
                code: COMMUNICATION_ERROR_CODES.NOTIFICATION_NOT_FOUND,
            });
        }
        return toNotificationResponse(notification);
    }

    async listNotifications(
        filters: { userId?: string; type?: string; status?: string },
        context: CommunicationContext
    ): Promise<NotificationResponse[]> {
        const notifications = await this.repository.findNotifications(context.tenantId, filters);
        return notifications.map(toNotificationResponse);
    }

    async getUserNotifications(
        userId: string,
        context: CommunicationContext
    ): Promise<{ notifications: NotificationResponse[]; unreadCount: number }> {
        const [notifications, unreadCount] = await Promise.all([
            this.repository.findUserNotifications(userId, context.tenantId),
            this.repository.findUnreadCount(userId, context.tenantId),
        ]);

        return {
            notifications: notifications.map(toNotificationResponse),
            unreadCount,
        };
    }

    async markNotificationAsRead(
        id: string,
        context: CommunicationContext
    ): Promise<NotificationResponse> {
        const notification = await this.repository.findNotificationById(id, context.tenantId);
        if (!notification) {
            throw new NotFoundError('Notification not found', {
                code: COMMUNICATION_ERROR_CODES.NOTIFICATION_NOT_FOUND,
            });
        }

        const updated = await this.repository.markAsRead(id);
        return toNotificationResponse(updated);
    }

    async markAllNotificationsAsRead(
        userId: string,
        context: CommunicationContext
    ): Promise<{ count: number }> {
        const result = await this.repository.markAllAsRead(userId, context.tenantId);
        return { count: result.count };
    }
}

export const communicationService = new CommunicationService();
