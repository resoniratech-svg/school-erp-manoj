/**
 * Usage Repository
 * Append-only usage event storage
 * NO UPDATE, NO DELETE - EVER
 */
import { prisma } from '@school-erp/database';
import type { UsageMetric } from '@prisma/client';

export class UsageRepository {
    /**
     * Append usage event (increment/decrement)
     * This is the ONLY write operation
     */
    async append(data: {
        tenantId: string;
        metric: UsageMetric;
        delta: number;
        source: string;
        entityId?: string;
    }): Promise<void> {
        await prisma.usageEvent.create({
            data: {
                tenantId: data.tenantId,
                metric: data.metric,
                delta: data.delta,
                source: data.source,
                entityId: data.entityId,
            },
        });
    }

    /**
     * Get aggregated usage for a metric
     * SUM of all deltas for tenant + metric
     */
    async getAggregatedUsage(
        tenantId: string,
        metric: UsageMetric
    ): Promise<number> {
        const result = await prisma.usageEvent.aggregate({
            where: {
                tenantId,
                metric,
            },
            _sum: {
                delta: true,
            },
        });

        return result._sum.delta ?? 0;
    }

    /**
     * Get aggregated usage for all metrics
     */
    async getAggregatedUsageAll(
        tenantId: string
    ): Promise<Record<string, number>> {
        const results = await prisma.usageEvent.groupBy({
            by: ['metric'],
            where: { tenantId },
            _sum: { delta: true },
        });

        const usage: Record<string, number> = {};
        for (const result of results) {
            usage[result.metric] = result._sum.delta ?? 0;
        }

        return usage;
    }

    /**
     * Get usage events for audit (read-only)
     */
    async getEvents(
        tenantId: string,
        options?: {
            metric?: UsageMetric;
            limit?: number;
            offset?: number;
        }
    ): Promise<Array<{
        id: string;
        metric: string;
        delta: number;
        source: string;
        entityId: string | null;
        createdAt: Date;
    }>> {
        return prisma.usageEvent.findMany({
            where: {
                tenantId,
                ...(options?.metric && { metric: options.metric }),
            },
            orderBy: { createdAt: 'desc' },
            take: options?.limit ?? 100,
            skip: options?.offset ?? 0,
        });
    }

    // NO DELETE METHOD - EVER
    // NO UPDATE METHOD - EVER
}

export const usageRepository = new UsageRepository();
