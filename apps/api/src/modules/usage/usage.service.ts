/**
 * Usage Service
 * Single source of truth for usage metering
 * 
 * "We never store totals. We derive totals."
 */
import { UsageRepository, usageRepository } from './usage.repository';
import { configService } from '../config/config.service';
import { USAGE_METRICS, METRIC_TO_LIMIT_KEY } from './usage.constants';
import type { UsageSummary, UsageSummaryResponse, UsageWithLimit, UsageContext } from './usage.types';
import type { UsageMetric } from '@prisma/client';
import { getLogger } from '../../utils/logger';

const logger = getLogger('usage-service');

export class UsageService {
    constructor(private readonly repository: UsageRepository = usageRepository) { }

    /**
     * Increment usage (append event)
     * Called by business modules on create/delete
     */
    async increment(
        tenantId: string,
        metric: string,
        delta: number,
        meta?: { source: string; entityId?: string }
    ): Promise<void> {
        await this.repository.append({
            tenantId,
            metric: metric as UsageMetric,
            delta,
            source: meta?.source || 'unknown',
            entityId: meta?.entityId,
        });

        logger.info(`Usage: tenant=${tenantId}, metric=${metric}, delta=${delta > 0 ? '+' : ''}${delta}`);
    }

    /**
     * Get current usage for a metric
     * Returns aggregated sum of all events
     */
    async getUsage(tenantId: string, metric: string): Promise<number> {
        return this.repository.getAggregatedUsage(tenantId, metric as UsageMetric);
    }

    /**
     * Get usage summary for all metrics
     */
    async getUsageSummary(tenantId: string): Promise<UsageSummary> {
        const usage = await this.repository.getAggregatedUsageAll(tenantId);

        return {
            students: usage[USAGE_METRICS.STUDENTS] ?? 0,
            staff: usage[USAGE_METRICS.STAFF] ?? 0,
            branches: usage[USAGE_METRICS.BRANCHES] ?? 0,
            storage_mb: usage[USAGE_METRICS.STORAGE_MB] ?? 0,
            notifications: usage[USAGE_METRICS.NOTIFICATIONS] ?? 0,
        };
    }

    /**
     * Get usage with limits (for UI)
     */
    async getUsageWithLimits(context: UsageContext): Promise<UsageSummaryResponse> {
        const usage = await this.getUsageSummary(context.tenantId);

        // Get limits from config service
        const limits: UsageSummary = {
            students: await this.getLimit(context, USAGE_METRICS.STUDENTS),
            staff: await this.getLimit(context, USAGE_METRICS.STAFF),
            branches: await this.getLimit(context, USAGE_METRICS.BRANCHES),
            storage_mb: await this.getLimit(context, USAGE_METRICS.STORAGE_MB),
            notifications: await this.getLimit(context, USAGE_METRICS.NOTIFICATIONS),
        };

        // Build items array
        const items: UsageWithLimit[] = Object.keys(USAGE_METRICS).map((key) => {
            const metric = USAGE_METRICS[key as keyof typeof USAGE_METRICS];
            const used = usage[metric as keyof UsageSummary] ?? 0;
            const limit = limits[metric as keyof UsageSummary] ?? 0;
            const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;

            return {
                metric,
                used,
                limit,
                percentage: Math.min(percentage, 100),
                isAtLimit: used >= limit,
            };
        });

        return { usage, limits, items };
    }

    /**
     * Check if at limit for a metric
     */
    async isAtLimit(tenantId: string, metric: string, context: UsageContext): Promise<boolean> {
        const used = await this.getUsage(tenantId, metric);
        const limit = await this.getLimit(context, metric);
        return used >= limit;
    }

    /**
     * Get limit for a metric from config
     */
    private async getLimit(context: UsageContext, metric: string): Promise<number> {
        const limitKey = METRIC_TO_LIMIT_KEY[metric];
        if (!limitKey) {
            return Infinity;
        }

        try {
            const limit = await configService.getLimit(limitKey, {
                tenantId: context.tenantId,
                userId: context.userId || 'system',
            });
            // Storage limit is in GB in config, convert to MB
            if (metric === USAGE_METRICS.STORAGE_MB) {
                return limit * 1024;
            }
            return limit;
        } catch {
            logger.warn(`Failed to get limit for ${limitKey}, using default`);
            return Infinity;
        }
    }
}

export const usageService = new UsageService();
