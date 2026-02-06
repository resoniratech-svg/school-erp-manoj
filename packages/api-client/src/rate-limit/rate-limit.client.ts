/**
 * Rate Limit Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse, PaginatedResponse } from '../types/api-response';
import { buildQueryParams, type QueryParams } from '../types/pagination';

// Types
export interface RateLimitRule {
    id: string;
    name: string;
    endpoint: string;
    windowSeconds: number;
    maxRequests: number;
    scope: 'global' | 'tenant' | 'user' | 'ip';
    enabled: boolean;
}

export interface RateLimitStatus {
    endpoint: string;
    remaining: number;
    limit: number;
    resetAt: Date;
}

/**
 * Rate Limit Client
 */
export const rateLimitClient = {
    /**
     * List rate limit rules
     */
    async list(params?: QueryParams): Promise<PaginatedResponse<RateLimitRule>> {
        const query = buildQueryParams(params || {});
        const response = await apiClient.get<PaginatedResponse<RateLimitRule>>(
            `/api/v1/rate-limit/rules${query}`
        );
        return response.data;
    },

    /**
     * Get rule by ID
     */
    async get(id: string): Promise<RateLimitRule> {
        const response = await apiClient.get<ApiResponse<RateLimitRule>>(
            `/api/v1/rate-limit/rules/${id}`
        );
        return response.data.data;
    },

    /**
     * Create rule
     */
    async create(data: Omit<RateLimitRule, 'id'>): Promise<RateLimitRule> {
        const response = await apiClient.post<ApiResponse<RateLimitRule>>(
            '/api/v1/rate-limit/rules',
            data
        );
        return response.data.data;
    },

    /**
     * Update rule
     */
    async update(id: string, data: Partial<RateLimitRule>): Promise<RateLimitRule> {
        const response = await apiClient.patch<ApiResponse<RateLimitRule>>(
            `/api/v1/rate-limit/rules/${id}`,
            data
        );
        return response.data.data;
    },

    /**
     * Delete rule
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete(`/api/v1/rate-limit/rules/${id}`);
    },

    /**
     * Get current rate limit status
     */
    async getStatus(): Promise<RateLimitStatus[]> {
        const response = await apiClient.get<ApiResponse<RateLimitStatus[]>>(
            '/api/v1/rate-limit/status'
        );
        return response.data.data;
    },
};
