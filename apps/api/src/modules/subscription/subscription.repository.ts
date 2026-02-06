/**
 * Subscription Repository
 * Database operations for Plans and TenantSubscriptions
 */
import { prisma } from '@school-erp/database';
import type { Plan, TenantSubscription, SubscriptionStatus } from '@prisma/client';

export class SubscriptionRepository {
    /**
     * Get all active public plans
     */
    async getPublicPlans(): Promise<Plan[]> {
        return prisma.plan.findMany({
            where: {
                isActive: true,
                isPublic: true,
            },
            orderBy: { displayOrder: 'asc' },
        });
    }

    /**
     * Get plan by code
     */
    async getPlanByCode(code: string): Promise<Plan | null> {
        return prisma.plan.findUnique({
            where: { code },
        });
    }

    /**
     * Get plan by ID
     */
    async getPlanById(id: string): Promise<Plan | null> {
        return prisma.plan.findUnique({
            where: { id },
        });
    }

    /**
     * Get subscription by tenant ID
     */
    async getByTenantId(tenantId: string): Promise<(TenantSubscription & { plan: Plan }) | null> {
        return prisma.tenantSubscription.findUnique({
            where: { tenantId },
            include: { plan: true },
        });
    }

    /**
     * Create subscription
     */
    async create(data: {
        tenantId: string;
        planId: string;
        status: SubscriptionStatus;
        trialEndsAt?: Date;
        startedAt?: Date;
        endsAt?: Date;
    }): Promise<TenantSubscription & { plan: Plan }> {
        return prisma.tenantSubscription.create({
            data: {
                tenantId: data.tenantId,
                planId: data.planId,
                status: data.status,
                trialEndsAt: data.trialEndsAt,
                startedAt: data.startedAt ?? new Date(),
                endsAt: data.endsAt,
            },
            include: { plan: true },
        });
    }

    /**
     * Update subscription
     */
    async update(
        tenantId: string,
        data: {
            planId?: string;
            status?: SubscriptionStatus;
            trialEndsAt?: Date | null;
            endsAt?: Date | null;
        }
    ): Promise<TenantSubscription & { plan: Plan }> {
        return prisma.tenantSubscription.update({
            where: { tenantId },
            data,
            include: { plan: true },
        });
    }

    /**
     * Get all expired trials (for cron job)
     */
    async getExpiredTrials(): Promise<TenantSubscription[]> {
        return prisma.tenantSubscription.findMany({
            where: {
                status: 'trialing',
                trialEndsAt: {
                    lt: new Date(),
                },
            },
        });
    }

    /**
     * Batch update status for expired trials
     */
    async markTrialsExpired(subscriptionIds: string[]): Promise<number> {
        const result = await prisma.tenantSubscription.updateMany({
            where: {
                id: { in: subscriptionIds },
                status: 'trialing',
            },
            data: {
                status: 'past_due',
            },
        });
        return result.count;
    }

    /**
     * Check if subscription exists for tenant
     */
    async exists(tenantId: string): Promise<boolean> {
        const count = await prisma.tenantSubscription.count({
            where: { tenantId },
        });
        return count > 0;
    }
}

export const subscriptionRepository = new SubscriptionRepository();
