/**
 * Observability Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse } from '../types/api-response';

// Types
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    uptime: number;
    version: string;
    components: Array<{
        name: string;
        status: 'healthy' | 'degraded' | 'unhealthy';
        latencyMs?: number;
        message?: string;
    }>;
}

export interface ReadinessStatus {
    ready: boolean;
    checks: {
        database: boolean;
        redis: boolean;
        workers: boolean;
    };
}

export interface SystemStatus {
    uptime: number;
    memory: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
    };
    requests: {
        total: number;
        perSecond: number;
    };
    errors: {
        total: number;
        rate: number;
    };
    jobs: {
        queued: number;
        processed: number;
        failed: number;
    };
}

/**
 * Observability Client
 */
export const observabilityClient = {
    /**
     * Get health status
     */
    async health(): Promise<HealthStatus> {
        const response = await apiClient.get<HealthStatus>('/health');
        return response.data;
    },

    /**
     * Get readiness status
     */
    async ready(): Promise<ReadinessStatus> {
        const response = await apiClient.get<ReadinessStatus>('/ready');
        return response.data;
    },

    /**
     * Get system status
     */
    async status(): Promise<SystemStatus> {
        const response = await apiClient.get<ApiResponse<SystemStatus>>('/status');
        return response.data.data;
    },

    /**
     * Get raw Prometheus metrics
     */
    async metrics(): Promise<string> {
        const response = await apiClient.get<string>('/metrics', {
            responseType: 'text',
        });
        return response.data;
    },
};
