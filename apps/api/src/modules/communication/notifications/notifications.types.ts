/**
 * Notifications Types
 */
import type { NotificationResponse } from '../communication.types';

export interface NotificationListResponse {
    notifications: NotificationResponse[];
    unreadCount: number;
}

export interface BulkSendResult {
    sent: number;
    failed: number;
}
