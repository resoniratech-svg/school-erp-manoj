/**
 * Usage API Client
 * Read-only usage data for frontend
 */
import { apiClient } from '../core/axios';
import type { ApiResponse } from '../types/api-response';

// Types
export interface UsageSummary {
    students: number;
    staff: number;
    branches: number;
    storage_mb: number;
    notifications: number;
}

export interface UsageWithLimit {
    metric: string;
    used: number;
    limit: number;
    percentage: number;
    isAtLimit: boolean;
}

export interface UsageSummaryResponse {
    usage: UsageSummary;
    limits: UsageSummary;
    items: UsageWithLimit[];
}

export interface UsageMetricResponse {
    metric: string;
    used: number;
    isAtLimit: boolean;
}

const BASE_URL = '/usage';

export const usageClient = {
    /**
     * Get usage summary with limits
     */
    getSummary: async (): Promise<UsageSummaryResponse> => {
        const response = await apiClient.get<ApiResponse<UsageSummaryResponse>>(
            `${BASE_URL}/summary`
        );
        return response.data.data;
    },

    /**
     * Get usage for a specific metric
     */
    getMetric: async (metric: string): Promise<UsageMetricResponse> => {
        const response = await apiClient.get<ApiResponse<UsageMetricResponse>>(
            `${BASE_URL}/${metric}`
        );
        return response.data.data;
    },
};
