/**
 * Notification Delivery Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse, PaginatedResponse } from '../types/api-response';
import { buildQueryParams, type QueryParams } from '../types/pagination';

// Types
export interface DeliveryRecord {
    id: string;
    notificationId: string;
    channel: 'email' | 'sms' | 'whatsapp';
    provider: string;
    target: string;
    status: 'pending' | 'sent' | 'failed';
    failureReason?: string;
    retryCount: number;
    createdAt: Date;
}

/**
 * Notification Delivery Client
 */
export const notificationDeliveryClient = {
    /**
     * List deliveries
     */
    async list(params?: QueryParams & {
        notificationId?: string;
        channel?: string;
        status?: string;
    }): Promise<PaginatedResponse<DeliveryRecord>> {
        const query = buildQueryParams(params || {});
        const response = await apiClient.get<PaginatedResponse<DeliveryRecord>>(
            `/api/v1/notification-delivery${query}`
        );
        return response.data;
    },

    /**
     * Get delivery by ID
     */
    async get(id: string): Promise<DeliveryRecord> {
        const response = await apiClient.get<ApiResponse<DeliveryRecord>>(
            `/api/v1/notification-delivery/${id}`
        );
        return response.data.data;
    },

    /**
     * Retry failed delivery
     */
    async retry(id: string): Promise<DeliveryRecord> {
        const response = await apiClient.post<ApiResponse<DeliveryRecord>>(
            `/api/v1/notification-delivery/${id}/retry`
        );
        return response.data.data;
    },
};
