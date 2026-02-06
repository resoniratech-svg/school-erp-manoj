/**
 * System Config Mapper
 * Normalizes DB rows and converts values to correct runtime types
 */
import type { ConfigEntry, ConfigResponse, ResolvedConfigResponse } from './config.types';
import { ALLOWED_CONFIG_KEYS, CONFIG_VALUE_TYPE } from './config.constants';

type ConfigRecord = {
    id: string;
    configKey: string;
    configValue: string;
    valueType: string;
    scope: string;
    tenantId: string;
    branchId: string | null;
    updatedBy: string;
    updatedAt: Date;
    createdAt: Date;
};

/**
 * Parse stored string value to correct runtime type
 */
export function parseConfigValue(value: string, valueType: string): unknown {
    switch (valueType) {
        case CONFIG_VALUE_TYPE.BOOLEAN:
            return value === 'true';
        case CONFIG_VALUE_TYPE.NUMBER:
            return Number(value);
        case CONFIG_VALUE_TYPE.STRING:
        case CONFIG_VALUE_TYPE.ENUM:
        default:
            return value;
    }
}

/**
 * Serialize runtime value to string for storage
 */
export function serializeConfigValue(value: unknown): string {
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    if (typeof value === 'number') {
        return String(value);
    }
    return String(value);
}

/**
 * Map DB record to response
 */
export function mapConfigToResponse(config: ConfigRecord): ConfigResponse {
    return {
        key: config.configKey,
        value: parseConfigValue(config.configValue, config.valueType),
        valueType: config.valueType,
        scope: config.scope,
        branchId: config.branchId,
        updatedBy: config.updatedBy,
        updatedAt: config.updatedAt,
    };
}

/**
 * Create resolved config (merged tenant + branch)
 */
export function createResolvedConfig(
    key: string,
    tenantConfig: ConfigRecord | null,
    branchConfig: ConfigRecord | null
): ResolvedConfigResponse {
    const keyConfig = ALLOWED_CONFIG_KEYS[key as keyof typeof ALLOWED_CONFIG_KEYS];
    const defaultValue = keyConfig?.default ?? null;
    const valueType = keyConfig?.type ?? CONFIG_VALUE_TYPE.STRING;

    const tenantValue = tenantConfig
        ? parseConfigValue(tenantConfig.configValue, tenantConfig.valueType)
        : null;

    const branchOverride = branchConfig
        ? parseConfigValue(branchConfig.configValue, branchConfig.valueType)
        : null;

    // Resolution: branch > tenant > default
    let resolvedValue: unknown;
    let source: 'default' | 'tenant' | 'branch';

    if (branchOverride !== null) {
        resolvedValue = branchOverride;
        source = 'branch';
    } else if (tenantValue !== null) {
        resolvedValue = tenantValue;
        source = 'tenant';
    } else {
        resolvedValue = defaultValue;
        source = 'default';
    }

    return {
        key,
        value: resolvedValue,
        valueType,
        source,
        tenantValue,
        branchOverride,
    };
}

/**
 * Get value type for a key from whitelist
 */
export function getValueTypeForKey(key: string): string {
    const keyConfig = ALLOWED_CONFIG_KEYS[key as keyof typeof ALLOWED_CONFIG_KEYS];
    return keyConfig?.type ?? CONFIG_VALUE_TYPE.STRING;
}
