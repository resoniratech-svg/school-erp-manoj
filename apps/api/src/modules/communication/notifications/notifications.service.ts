/**
 * Notifications Service
 * CRITICAL: Append-only - logs are immutable
 */
import { communicationService } from '../communication.service';
import type { NotificationResponse, CommunicationContext } from '../communication.types';
import type { SendNotificationInput, BulkSendNotificationInput } from '../communication.validator';
import type { BulkSendResult } from './notifications.types';

export class NotificationsService {
    /**
     * Send notification (append-only)
     */
    async send(input: SendNotificationInput, context: CommunicationContext): Promise<NotificationResponse> {
        return communicationService.sendNotification(input, context);
    }

    /**
     * Bulk send notifications (append-only)
     */
    async sendBulk(input: BulkSendNotificationInput, context: CommunicationContext): Promise<BulkSendResult> {
        return communicationService.sendBulkNotification(input, context);
    }

    async getById(id: string, context: CommunicationContext): Promise<NotificationResponse> {
        return communicationService.getNotification(id, context);
    }

    async list(
        filters: { userId?: string; type?: string; status?: string },
        context: CommunicationContext
    ): Promise<NotificationResponse[]> {
        return communicationService.listNotifications(filters, context);
    }

    async getUserNotifications(userId: string, context: CommunicationContext) {
        return communicationService.getUserNotifications(userId, context);
    }

    async markAsRead(id: string, context: CommunicationContext): Promise<NotificationResponse> {
        return communicationService.markNotificationAsRead(id, context);
    }

    async markAllAsRead(userId: string, context: CommunicationContext): Promise<{ count: number }> {
        return communicationService.markAllNotificationsAsRead(userId, context);
    }

    // NO DELETE METHOD - Notifications are append-only
}

export const notificationsService = new NotificationsService();
