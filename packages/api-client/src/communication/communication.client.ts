/**
 * Communication Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse, PaginatedResponse } from '../types/api-response';
import { buildQueryParams, type QueryParams } from '../types/pagination';

// Types
export interface Announcement {
    id: string;
    title: string;
    content: string;
    priority?: 'low' | 'medium' | 'high';
    audience: string;
    status: 'draft' | 'published' | 'archived';
    createdAt: string;
    publishedAt?: Date;
    expiresAt?: Date;
    createdBy: string;
}

export interface Message {
    id: string;
    senderId: string;
    recipientId: string;
    subject: string;
    content: string;
    isRead: boolean;
    sentAt: Date;
}

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    channel: string;
    status: string;
    sentAt?: Date;
    data?: Record<string, unknown>;
    createdAt: Date;
    recipient?: {
        name: string;
    };
}

/**
 * Communication Client
 */
export const communicationClient = {
    /**
     * Announcements
     */
    announcements: {
        async list(params?: QueryParams): Promise<PaginatedResponse<Announcement>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<Announcement>>(
                `/api/v1/communication/announcements${query}`
            );
            return response.data;
        },

        async get(id: string): Promise<Announcement> {
            const response = await apiClient.get<ApiResponse<Announcement>>(
                `/api/v1/communication/announcements/${id}`
            );
            return response.data.data;
        },

        async create(data: {
            title: string;
            content: string;
            audience: string;
            priority?: 'low' | 'medium' | 'high';
        }): Promise<Announcement> {
            const response = await apiClient.post<ApiResponse<Announcement>>(
                '/api/v1/communication/announcements',
                data
            );
            return response.data.data;
        },

        async update(id: string, data: Partial<Announcement>): Promise<Announcement> {
            const response = await apiClient.patch<ApiResponse<Announcement>>(
                `/api/v1/communication/announcements/${id}`,
                data
            );
            return response.data.data;
        },

        async delete(id: string): Promise<void> {
            await apiClient.delete(`/api/v1/communication/announcements/${id}`);
        },

        async publish(id: string): Promise<void> {
            await apiClient.post(`/api/v1/communication/announcements/${id}/publish`, {});
        },
    },

    /**
     * Messages
     */
    messages: {
        async inbox(params?: QueryParams): Promise<PaginatedResponse<Message>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<Message>>(
                `/api/v1/communication/messages/inbox${query}`
            );
            return response.data;
        },

        async sent(params?: QueryParams): Promise<PaginatedResponse<Message>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<Message>>(
                `/api/v1/communication/messages/sent${query}`
            );
            return response.data;
        },

        async get(id: string): Promise<Message> {
            const response = await apiClient.get<ApiResponse<Message>>(
                `/api/v1/communication/messages/${id}`
            );
            return response.data.data;
        },

        async send(data: { recipientId: string; subject: string; content: string }): Promise<Message> {
            const response = await apiClient.post<ApiResponse<Message>>(
                '/api/v1/communication/messages',
                data
            );
            return response.data.data;
        },

        async markRead(id: string): Promise<void> {
            await apiClient.patch(`/api/v1/communication/messages/${id}/read`);
        },

        async delete(id: string): Promise<void> {
            await apiClient.delete(`/api/v1/communication/messages/${id}`);
        },
    },

    /**
     * Notifications
     */
    notifications: {
        async list(params?: QueryParams & { unreadOnly?: boolean }): Promise<PaginatedResponse<Notification>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<Notification>>(
                `/api/v1/communication/notifications${query}`
            );
            return response.data;
        },

        async markRead(id: string): Promise<void> {
            await apiClient.patch(`/api/v1/communication/notifications/${id}/read`);
        },

        async markAllRead(): Promise<void> {
            await apiClient.patch('/api/v1/communication/notifications/read-all');
        },

        async getUnreadCount(): Promise<number> {
            const response = await apiClient.get<ApiResponse<{ count: number }>>(
                '/api/v1/communication/notifications/unread-count'
            );
            return response.data.data.count;
        },
    },
};
