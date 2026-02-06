/**
 * Notifications Controller
 */
import { communicationController } from '../communication.controller';

export const notificationsController = {
    send: communicationController.sendNotification,
    sendBulk: communicationController.sendBulkNotification,
    list: communicationController.listNotifications,
    getUserNotifications: communicationController.getUserNotifications,
    markAsRead: communicationController.markAsRead,
    markAllAsRead: communicationController.markAllAsRead,
    // NO DELETE ENDPOINT
};
