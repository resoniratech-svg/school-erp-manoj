/**
 * System Config Repository
 * UPSERT ONLY - NO DELETE
 */
import { prisma } from '@school-erp/database';
import { CONFIG_SCOPE } from './config.constants';

export class ConfigRepository {
    /**
     * Get all tenant-level configs
     */
    async getTenantConfigs(tenantId: string, prefix?: string) {
        return prisma.systemConfig.findMany({
            where: {
                tenantId,
                scope: CONFIG_SCOPE.TENANT,
                branchId: null,
                ...(prefix && { configKey: { startsWith: prefix } }),
            },
            orderBy: { configKey: 'asc' },
        });
    }

    /**
     * Get all branch-level configs (overrides)
     */
    async getBranchConfigs(tenantId: string, branchId: string, prefix?: string) {
        return prisma.systemConfig.findMany({
            where: {
                tenantId,
                branchId,
                scope: CONFIG_SCOPE.BRANCH,
                ...(prefix && { configKey: { startsWith: prefix } }),
            },
            orderBy: { configKey: 'asc' },
        });
    }

    /**
     * Get single config by key
     */
    async getConfigByKey(tenantId: string, configKey: string, branchId?: string) {
        // First try branch-level if branchId provided
        if (branchId) {
            const branchConfig = await prisma.systemConfig.findFirst({
                where: {
                    tenantId,
                    branchId,
                    configKey,
                    scope: CONFIG_SCOPE.BRANCH,
                },
            });
            if (branchConfig) return branchConfig;
        }

        // Fall back to tenant-level
        return prisma.systemConfig.findFirst({
            where: {
                tenantId,
                configKey,
                scope: CONFIG_SCOPE.TENANT,
                branchId: null,
            },
        });
    }

    /**
     * Upsert config (CREATE or UPDATE, never DELETE)
     */
    async upsertConfig(
        tenantId: string,
        configKey: string,
        configValue: string,
        valueType: string,
        scope: string,
        updatedBy: string,
        branchId?: string
    ) {
        // Build unique constraint combination
        const whereClause = {
            tenantId,
            configKey,
            scope,
            branchId: scope === CONFIG_SCOPE.BRANCH ? branchId : null,
        };

        // Find existing
        const existing = await prisma.systemConfig.findFirst({
            where: whereClause,
        });

        if (existing) {
            // Update existing
            return prisma.systemConfig.update({
                where: { id: existing.id },
                data: {
                    configValue,
                    valueType,
                    updatedBy,
                    updatedAt: new Date(),
                },
            });
        } else {
            // Create new
            return prisma.systemConfig.create({
                data: {
                    tenantId,
                    configKey,
                    configValue,
                    valueType,
                    scope,
                    branchId: scope === CONFIG_SCOPE.BRANCH ? branchId : null,
                    updatedBy,
                },
            });
        }
    }

    /**
     * Batch upsert configs
     */
    async batchUpsertConfigs(
        tenantId: string,
        configs: Array<{ key: string; value: string; valueType: string }>,
        scope: string,
        updatedBy: string,
        branchId?: string
    ) {
        const results = [];

        // Use transaction for consistency
        await prisma.$transaction(async (tx) => {
            for (const config of configs) {
                const whereClause = {
                    tenantId,
                    configKey: config.key,
                    scope,
                    branchId: scope === CONFIG_SCOPE.BRANCH ? branchId : null,
                };

                const existing = await tx.systemConfig.findFirst({
                    where: whereClause,
                });

                if (existing) {
                    const updated = await tx.systemConfig.update({
                        where: { id: existing.id },
                        data: {
                            configValue: config.value,
                            valueType: config.valueType,
                            updatedBy,
                            updatedAt: new Date(),
                        },
                    });
                    results.push(updated);
                } else {
                    const created = await tx.systemConfig.create({
                        data: {
                            tenantId,
                            configKey: config.key,
                            configValue: config.value,
                            valueType: config.valueType,
                            scope,
                            branchId: scope === CONFIG_SCOPE.BRANCH ? branchId : null,
                            updatedBy,
                        },
                    });
                    results.push(created);
                }
            }
        });

        return results;
    }

    // NO DELETE METHOD - Configs are never deleted
}

export const configRepository = new ConfigRepository();
