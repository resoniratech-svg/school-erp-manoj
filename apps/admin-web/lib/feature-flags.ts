/**
 * Feature Flag Utilities
 */

import { configClient } from '@school-erp/api-client';

export interface FeatureFlags {
    'fees.enabled': boolean;
    'attendance.enabled': boolean;
    'exams.enabled': boolean;
    'reports.enabled': boolean;
    'library.enabled': boolean;
    'transport.enabled': boolean;
    'communication.enabled': boolean;
    [key: string]: boolean;
}

/**
 * Default feature flags
 */
export const DEFAULT_FLAGS: FeatureFlags = {
    'fees.enabled': true,
    'attendance.enabled': true,
    'exams.enabled': true,
    'reports.enabled': true,
    'library.enabled': true,
    'transport.enabled': true,
    'communication.enabled': true,
};

/**
 * Load feature flags from backend
 */
export async function loadFeatureFlags(): Promise<FeatureFlags> {
    try {
        const configs = await configClient.getAll();
        const flags: FeatureFlags = { ...DEFAULT_FLAGS };

        for (const config of configs) {
            if (config.key.endsWith('.enabled') && typeof config.value === 'boolean') {
                flags[config.key] = config.value;
            }
        }

        return flags;
    } catch {
        return DEFAULT_FLAGS;
    }
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(flags: FeatureFlags, feature: string): boolean {
    const key = feature.includes('.') ? feature : `${feature}.enabled`;
    return flags[key] ?? true;
}
