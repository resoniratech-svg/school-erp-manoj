/**
 * Config Client
 * System configuration and feature flags
 */
import { apiClient } from '../core/axios';
import type { ApiResponse } from '../types/api-response';

// Types
export interface ConfigEntry {
    key: string;
    value: unknown;
    type: 'string' | 'number' | 'boolean' | 'json';
    scope: 'system' | 'tenant' | 'branch';
}

export interface FeatureFlag {
    key: string;
    name: string;
    description?: string;
    enabled: boolean;
    scope: 'default' | 'tenant' | 'branch';
}

export interface ConfigLimit {
    key: string;
    name: string;
    description?: string;
    value: number;
    scope: 'default' | 'tenant' | 'branch';
}

export interface ConfigPolicy {
    key: string;
    name: string;
    description?: string;
    enabled: boolean;
    scope: 'default' | 'tenant' | 'branch';
}

/**
 * Config Client
 */
export const configClient = {
    /**
     * Get all configurations
     */
    async getAll(): Promise<ConfigEntry[]> {
        const response = await apiClient.get<ApiResponse<ConfigEntry[]>>(
            '/api/v1/config'
        );
        return response.data.data;
    },

    /**
     * Get config by key
     */
    async get(key: string): Promise<ConfigEntry | null> {
        try {
            const response = await apiClient.get<ApiResponse<ConfigEntry>>(
                `/api/v1/config/${encodeURIComponent(key)}`
            );
            return response.data.data;
        } catch {
            return null;
        }
    },

    /**
     * Get config value
     */
    async getValue<T = unknown>(key: string, defaultValue: T): Promise<T> {
        const config = await this.get(key);
        return (config?.value as T) ?? defaultValue;
    },

    /**
     * Check if feature is enabled
     */
    async isFeatureEnabled(featureKey: string): Promise<boolean> {
        const key = featureKey.includes('.') ? featureKey : `${featureKey}.enabled`;
        return this.getValue(key, false);
    },

    /**
     * Get limit value
     */
    async getLimit(limitKey: string): Promise<number> {
        return this.getValue(limitKey, 0);
    },

    /**
     * Set config value (admin only)
     */
    async set(key: string, value: unknown): Promise<ConfigEntry> {
        const response = await apiClient.put<ApiResponse<ConfigEntry>>(
            `/api/v1/config/${encodeURIComponent(key)}`,
            { value }
        );
        return response.data.data;
    },

    /**
     * Delete config (admin only)
     */
    async delete(key: string): Promise<void> {
        await apiClient.delete(`/api/v1/config/${encodeURIComponent(key)}`);
    },

    /**
     * Helper: Get multiple configs
     */
    async getMultiple(keys: string[]): Promise<Map<string, unknown>> {
        const configs = await this.getAll();
        const result = new Map<string, unknown>();

        for (const key of keys) {
            const config = configs.find((c) => c.key === key);
            if (config) {
                result.set(key, config.value);
            }
        }

        return result;
    },

    /**
     * Feature Flags
     */
    features: {
        /**
         * List all feature flags
         */
        async list(): Promise<{ data: FeatureFlag[] }> {
            const response = await apiClient.get<ApiResponse<FeatureFlag[]>>(
                '/api/v1/config/features'
            );
            return { data: response.data.data };
        },

        /**
         * Update feature flag
         */
        async update(key: string, data: { enabled: boolean }): Promise<FeatureFlag> {
            const response = await apiClient.patch<ApiResponse<FeatureFlag>>(
                `/api/v1/config/features/${encodeURIComponent(key)}`,
                data
            );
            return response.data.data;
        },
    },

    /**
     * System Limits
     */
    limits: {
        /**
         * List all limits
         */
        async list(): Promise<{ data: ConfigLimit[] }> {
            const response = await apiClient.get<ApiResponse<ConfigLimit[]>>(
                '/api/v1/config/limits'
            );
            return { data: response.data.data };
        },

        /**
         * Update limit
         */
        async update(key: string, data: { value: number }): Promise<ConfigLimit> {
            const response = await apiClient.patch<ApiResponse<ConfigLimit>>(
                `/api/v1/config/limits/${encodeURIComponent(key)}`,
                data
            );
            return response.data.data;
        },
    },

    /**
     * Policies
     */
    policies: {
        /**
         * List all policies
         */
        async list(): Promise<{ data: ConfigPolicy[] }> {
            const response = await apiClient.get<ApiResponse<ConfigPolicy[]>>(
                '/api/v1/config/policies'
            );
            return { data: response.data.data };
        },

        /**
         * Update policy
         */
        async update(key: string, data: { enabled: boolean }): Promise<ConfigPolicy> {
            const response = await apiClient.patch<ApiResponse<ConfigPolicy>>(
                `/api/v1/config/policies/${encodeURIComponent(key)}`,
                data
            );
            return response.data.data;
        },
    },
};
