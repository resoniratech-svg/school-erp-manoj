/**
 * Jobs Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse, PaginatedResponse } from '../types/api-response';
import { buildQueryParams, type QueryParams } from '../types/pagination';

// Types
export interface Job {
    id: string;
    tenantId: string;
    type: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
    retryCount: number;
    maxRetry: number;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
}

export interface WorkerStatus {
    running: boolean;
    processing: number;
}

/**
 * Jobs Client
 */
export const jobsClient = {
    /**
     * List jobs
     */
    async list(params?: QueryParams & {
        type?: string;
        status?: string;
    }): Promise<PaginatedResponse<Job>> {
        const query = buildQueryParams(params || {});
        const response = await apiClient.get<PaginatedResponse<Job>>(
            `/api/v1/jobs${query}`
        );
        return response.data;
    },

    /**
     * Get job by ID
     */
    async get(id: string): Promise<Job> {
        const response = await apiClient.get<ApiResponse<Job>>(
            `/api/v1/jobs/${id}`
        );
        return response.data.data;
    },

    /**
     * Retry failed job
     */
    async retry(id: string): Promise<Job> {
        const response = await apiClient.post<ApiResponse<Job>>(
            `/api/v1/jobs/${id}/retry`
        );
        return response.data.data;
    },

    /**
     * Get worker status
     */
    async getWorkerStatus(): Promise<WorkerStatus> {
        const response = await apiClient.get<ApiResponse<WorkerStatus>>(
            '/api/v1/jobs/status'
        );
        return response.data.data;
    },
};
