/**
 * Audit Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse, PaginatedResponse } from '../types/api-response';
import { buildQueryParams, type QueryParams } from '../types/pagination';

// Types
export interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    userEmail?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

/**
 * Audit Client
 */
export const auditClient = {
    /**
     * List audit logs
     */
    async list(params?: QueryParams & {
        action?: string;
        entityType?: string;
        entityId?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<PaginatedResponse<AuditLog>> {
        const query = buildQueryParams(params || {});
        const response = await apiClient.get<PaginatedResponse<AuditLog>>(
            `/api/v1/audit${query}`
        );
        return response.data;
    },

    /**
     * Get audit log by ID
     */
    async get(id: string): Promise<AuditLog> {
        const response = await apiClient.get<ApiResponse<AuditLog>>(
            `/api/v1/audit/${id}`
        );
        return response.data.data;
    },

    /**
     * Get entity history
     */
    async getEntityHistory(entityType: string, entityId: string): Promise<AuditLog[]> {
        const response = await apiClient.get<ApiResponse<AuditLog[]>>(
            `/api/v1/audit/entity/${entityType}/${entityId}`
        );
        return response.data.data;
    },

    /**
     * Get user activity
     */
    async getUserActivity(userId: string, params?: QueryParams): Promise<PaginatedResponse<AuditLog>> {
        const query = buildQueryParams(params || {});
        const response = await apiClient.get<PaginatedResponse<AuditLog>>(
            `/api/v1/audit/user/${userId}${query}`
        );
        return response.data;
    },
};
