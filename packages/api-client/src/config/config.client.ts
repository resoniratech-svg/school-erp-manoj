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
};
