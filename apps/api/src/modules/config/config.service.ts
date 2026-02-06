/**
 * System Config Service
 * Core business logic with merge, validation, and audit logging
 * NO DELETE - UPSERT ONLY
 */
import { BadRequestError } from '@school-erp/shared';
import { ConfigRepository, configRepository } from './config.repository';
import { ALLOWED_CONFIG_KEYS, CONFIG_SCOPE, CONFIG_ERROR_CODES } from './config.constants';
import {
    mapConfigToResponse,
    createResolvedConfig,
    serializeConfigValue,
    getValueTypeForKey,
} from './config.mapper';
import type {
    ConfigResponse,
    ResolvedConfigResponse,
    AllConfigsResponse,
    ConfigContext,
} from './config.types';
import type { UpdateConfigBody, BatchUpdateConfigBody } from './config.validator';
import { getLogger } from '../../utils/logger';

const logger = getLogger('config-service');

export class ConfigService {
    constructor(private readonly repository: ConfigRepository = configRepository) { }

    /**
     * Get all resolved configs (merged tenant + branch)
     */
    async getAllConfigs(
        context: ConfigContext,
        filters?: { prefix?: string }
    ): Promise<AllConfigsResponse> {
        // Get tenant configs
        const tenantConfigs = await this.repository.getTenantConfigs(
            context.tenantId,
            filters?.prefix
        );

        // Get branch configs if branchId provided
        const branchConfigs = context.branchId
            ? await this.repository.getBranchConfigs(context.tenantId, context.branchId, filters?.prefix)
            : [];

        // Create lookup maps
        const tenantMap = new Map(tenantConfigs.map(c => [c.configKey, c]));
        const branchMap = new Map(branchConfigs.map(c => [c.configKey, c]));

        // Build resolved configs for all allowed keys
        const resolvedConfigs: ResolvedConfigResponse[] = [];

        for (const key of Object.keys(ALLOWED_CONFIG_KEYS)) {
            // Apply prefix filter if provided
            if (filters?.prefix && !key.startsWith(filters.prefix)) {
                continue;
            }

            const tenantConfig = tenantMap.get(key) || null;
            const branchConfig = branchMap.get(key) || null;

            resolvedConfigs.push(createResolvedConfig(key, tenantConfig, branchConfig));
        }

        return {
            configs: resolvedConfigs,
            scope: {
                tenantId: context.tenantId,
                branchId: context.branchId || null,
            },
        };
    }

    /**
     * Get single config by key
     */
    async getConfigByKey(key: string, context: ConfigContext): Promise<ResolvedConfigResponse> {
        // Validate key is allowed
        if (!(key in ALLOWED_CONFIG_KEYS)) {
            throw new BadRequestError(CONFIG_ERROR_CODES.INVALID_KEY);
        }

        // Get tenant config
        const tenantConfig = await this.repository.getConfigByKey(
            context.tenantId,
            key
        );

        // Get branch config if branchId provided
        const branchConfig = context.branchId
            ? await this.repository.getConfigByKey(context.tenantId, key, context.branchId)
            : null;

        return createResolvedConfig(key, tenantConfig, branchConfig);
    }

    /**
     * Update single config (UPSERT)
     */
    async updateConfig(
        input: UpdateConfigBody,
        context: ConfigContext
    ): Promise<ConfigResponse> {
        const { key, value, scope = CONFIG_SCOPE.TENANT } = input;

        // Validate key is allowed
        if (!(key in ALLOWED_CONFIG_KEYS)) {
            throw new BadRequestError(CONFIG_ERROR_CODES.INVALID_KEY);
        }

        // Validate scope/branchId combination
        if (scope === CONFIG_SCOPE.BRANCH && !context.branchId) {
            throw new BadRequestError('Branch ID required for branch-scope config');
        }

        const valueType = getValueTypeForKey(key);
        const serializedValue = serializeConfigValue(value);

        const result = await this.repository.upsertConfig(
            context.tenantId,
            key,
            serializedValue,
            valueType,
            scope,
            context.userId,
            context.branchId
        );

        // Audit log
        logger.info(
            `Config updated: ${key}=${value} (scope: ${scope}) by user ${context.userId}`
        );

        return mapConfigToResponse(result);
    }

    /**
     * Batch update configs (UPSERT)
     */
    async batchUpdateConfigs(
        input: BatchUpdateConfigBody,
        context: ConfigContext
    ): Promise<ConfigResponse[]> {
        const { configs, scope = CONFIG_SCOPE.TENANT } = input;

        // Validate all keys
        for (const config of configs) {
            if (!(config.key in ALLOWED_CONFIG_KEYS)) {
                throw new BadRequestError(`${CONFIG_ERROR_CODES.INVALID_KEY}: ${config.key}`);
            }
        }

        // Validate scope/branchId combination
        if (scope === CONFIG_SCOPE.BRANCH && !context.branchId) {
            throw new BadRequestError('Branch ID required for branch-scope config');
        }

        // Prepare configs with value types
        const preparedConfigs = configs.map(c => ({
            key: c.key,
            value: serializeConfigValue(c.value),
            valueType: getValueTypeForKey(c.key),
        }));

        const results = await this.repository.batchUpsertConfigs(
            context.tenantId,
            preparedConfigs,
            scope,
            context.userId,
            context.branchId
        );

        // Audit log
        logger.info(
            `Batch config update: ${configs.length} configs (scope: ${scope}) by user ${context.userId}`
        );

        return results.map(mapConfigToResponse);
    }

    /**
     * Get feature flag value (convenience method)
     */
    async isFeatureEnabled(featureKey: string, context: ConfigContext): Promise<boolean> {
        const config = await this.getConfigByKey(featureKey, context);
        return config.value === true;
    }

    /**
     * Get limit value (convenience method)
     */
    async getLimit(limitKey: string, context: ConfigContext): Promise<number> {
        const config = await this.getConfigByKey(limitKey, context);
        return typeof config.value === 'number' ? config.value : 0;
    }

    // NO DELETE METHOD - Configs are never deleted
}

export const configService = new ConfigService();
