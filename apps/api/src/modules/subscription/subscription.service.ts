/**
 * Subscription Service
 * Core business logic with config integration
 * NO DELETE - audit-safe operations only
 */
import { NotFoundError, ConflictError, BadRequestError } from '@school-erp/shared';
import { SubscriptionRepository, subscriptionRepository } from './subscription.repository';
import { configService } from '../config/config.service';
import {
    SUBSCRIPTION_ERROR_CODES,
    SUBSCRIPTION_STATUS,
    PLAN_CODES,
    PLAN_CONFIGS,
    TRIAL_CONFIG,
} from './subscription.constants';
import type {
    PlanResponse,
    SubscriptionResponse,
    SubscriptionContext,
} from './subscription.types';
import type { Plan, TenantSubscription } from '@prisma/client';
import { getLogger } from '../../utils/logger';

const logger = getLogger('subscription-service');

export class SubscriptionService {
    constructor(private readonly repository: SubscriptionRepository = subscriptionRepository) { }

    /**
     * Create trial subscription for new tenant
     * Called internally from tenant creation flow - NOT exposed via API
     */
    async createTrialSubscription(tenantId: string): Promise<SubscriptionResponse> {
        // Check if subscription already exists
        const exists = await this.repository.exists(tenantId);
        if (exists) {
            throw new ConflictError(SUBSCRIPTION_ERROR_CODES.ALREADY_EXISTS);
        }

        // Get FREE plan
        const freePlan = await this.repository.getPlanByCode(PLAN_CODES.FREE);
        if (!freePlan) {
            throw new NotFoundError(SUBSCRIPTION_ERROR_CODES.PLAN_NOT_FOUND);
        }

        // Calculate trial end date
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_CONFIG.DURATION_DAYS);

        // Create subscription
        const subscription = await this.repository.create({
            tenantId,
            planId: freePlan.id,
            status: 'trialing',
            trialEndsAt,
        });

        // Apply plan configs
        await this.applyPlanConfigs(tenantId, PLAN_CODES.FREE);

        logger.info(`Trial subscription created for tenant ${tenantId}, expires ${trialEndsAt.toISOString()}`);

        return this.mapToResponse(subscription);
    }

    /**
     * Get current subscription for tenant
     */
    async getCurrentSubscription(tenantId: string): Promise<SubscriptionResponse | null> {
        const subscription = await this.repository.getByTenantId(tenantId);
        if (!subscription) {
            return null;
        }
        return this.mapToResponse(subscription);
    }

    /**
     * Get all public plans
     */
    async listPlans(): Promise<PlanResponse[]> {
        const plans = await this.repository.getPublicPlans();
        return plans.map(this.mapPlanToResponse);
    }

    /**
     * Change subscription plan
     */
    async changePlan(
        tenantId: string,
        planCode: string,
        context: SubscriptionContext
    ): Promise<SubscriptionResponse> {
        // Get current subscription
        const current = await this.repository.getByTenantId(tenantId);
        if (!current) {
            throw new NotFoundError(SUBSCRIPTION_ERROR_CODES.NOT_FOUND);
        }

        // Get target plan
        const targetPlan = await this.repository.getPlanByCode(planCode);
        if (!targetPlan) {
            throw new NotFoundError(SUBSCRIPTION_ERROR_CODES.PLAN_NOT_FOUND);
        }

        if (!targetPlan.isActive) {
            throw new BadRequestError(SUBSCRIPTION_ERROR_CODES.PLAN_INACTIVE);
        }

        // Update subscription
        const newStatus = planCode === PLAN_CODES.FREE ? 'active' : 'active';
        const updated = await this.repository.update(tenantId, {
            planId: targetPlan.id,
            status: newStatus,
            trialEndsAt: null, // Clear trial on plan change
        });

        // Apply new plan configs
        await this.applyPlanConfigs(tenantId, planCode);

        logger.info(
            `Plan changed for tenant ${tenantId}: ${current.plan.code} -> ${planCode} by user ${context.userId}`
        );

        return this.mapToResponse(updated);
    }

    /**
     * Check if subscription is in active state
     */
    async isSubscriptionActive(tenantId: string): Promise<boolean> {
        const subscription = await this.repository.getByTenantId(tenantId);
        if (!subscription) {
            return false;
        }

        const activeStatuses = [SUBSCRIPTION_STATUS.TRIALING, SUBSCRIPTION_STATUS.ACTIVE];
        return activeStatuses.includes(subscription.status as string);
    }

    /**
     * Process expired trials (for cron job)
     */
    async processTrialExpiry(): Promise<number> {
        const expiredTrials = await this.repository.getExpiredTrials();

        if (expiredTrials.length === 0) {
            return 0;
        }

        const ids = expiredTrials.map((t) => t.id);
        const count = await this.repository.markTrialsExpired(ids);

        logger.info(`Marked ${count} expired trial subscriptions as past_due`);

        return count;
    }

    /**
     * Apply plan-specific configs using configService
     */
    private async applyPlanConfigs(tenantId: string, planCode: string): Promise<void> {
        const configs = PLAN_CONFIGS[planCode];
        if (!configs) {
            logger.warn(`No config defaults found for plan ${planCode}`);
            return;
        }

        const configUpdates = Object.entries(configs).map(([key, value]) => ({
            key,
            value,
        }));

        try {
            await configService.batchUpdateConfigs(
                { configs: configUpdates, scope: 'TENANT' },
                { tenantId, userId: 'system' }
            );

            logger.info(`Applied ${configUpdates.length} configs for plan ${planCode} to tenant ${tenantId}`);
        } catch (error) {
            logger.error(`Failed to apply plan configs for tenant ${tenantId}: ${error}`);
            // Don't throw - plan change should succeed even if config update fails
        }
    }

    /**
     * Map subscription to response
     */
    private mapToResponse(subscription: TenantSubscription & { plan: Plan }): SubscriptionResponse {
        const now = new Date();
        let trialDaysRemaining: number | null = null;

        if (subscription.status === 'trialing' && subscription.trialEndsAt) {
            const diff = subscription.trialEndsAt.getTime() - now.getTime();
            trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

        const activeStatuses = ['trialing', 'active'];

        return {
            id: subscription.id,
            tenantId: subscription.tenantId,
            plan: this.mapPlanToResponse(subscription.plan),
            status: subscription.status,
            trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
            trialDaysRemaining,
            startedAt: subscription.startedAt.toISOString(),
            endsAt: subscription.endsAt?.toISOString() ?? null,
            isActive: activeStatuses.includes(subscription.status),
            createdAt: subscription.createdAt.toISOString(),
            updatedAt: subscription.updatedAt.toISOString(),
        };
    }

    /**
     * Map plan to response
     */
    private mapPlanToResponse(plan: Plan): PlanResponse {
        // Format price for display (paise to rupees)
        const priceDisplay =
            plan.priceMonthly === 0
                ? 'Free'
                : `₹${(plan.priceMonthly / 100).toLocaleString('en-IN')}/month`;

        return {
            id: plan.id,
            code: plan.code,
            name: plan.name,
            description: plan.description,
            priceMonthly: plan.priceMonthly,
            priceDisplay,
            isActive: plan.isActive,
            isPublic: plan.isPublic,
            displayOrder: plan.displayOrder,
        };
    }
}

export const subscriptionService = new SubscriptionService();
