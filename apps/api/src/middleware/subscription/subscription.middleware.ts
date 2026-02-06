/**
 * Subscription Enforcement Middleware
 * 
 * CRITICAL: This middleware centrally enforces subscription rules
 * - Blocks API access when subscription is invalid
 * - Enforces feature flags based on plan
 * - Enforces numeric limits based on plan
 * 
 * MUST be registered AFTER auth middleware, BEFORE routes
 * 
 * NO business service should check subscription manually
 * This is the ONLY place subscription rules are enforced
 */
import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@school-erp/shared';
import { subscriptionService } from '../../modules/subscription/subscription.service';
import { configService } from '../../modules/config/config.service';
import {
    isPathAllowedWhenInactive,
    isWriteMethod,
    isInactiveStatus,
    getFeatureKeyFromPath,
    getLimitKeyFromPath,
} from './subscription.utils';
import { ENFORCEMENT_ERROR_CODES } from './subscription.constants';
import type { SubscriptionStatus } from './subscription.types';
import { getLogger } from '../../utils/logger';

const logger = getLogger('subscription-enforcement');

/**
 * Main subscription enforcement middleware
 * Enforces subscription status, feature flags, and limits
 */
export async function subscriptionEnforcementMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Get tenant from auth context
        const user = (req as Request & { user?: { tenantId: string; id: string } }).user;
        const tenantId = user?.tenantId;

        // Skip if no tenant context (public routes, webhooks)
        if (!tenantId) {
            return next();
        }

        const path = req.path;
        const method = req.method;

        // 1. Get subscription
        const subscription = await subscriptionService.getCurrentSubscription(tenantId);

        // Fail-safe: No subscription = deny
        if (!subscription) {
            logger.warn(`No subscription found for tenant ${tenantId}`);
            throw new ForbiddenError(ENFORCEMENT_ERROR_CODES.NO_SUBSCRIPTION);
        }

        const status = subscription.status as SubscriptionStatus;

        // Store subscription context on request
        req.subscriptionContext = {
            tenantId,
            planCode: subscription.plan.code,
            status,
        };

        // 2. Subscription Status Gate
        if (isInactiveStatus(status)) {
            if (!isPathAllowedWhenInactive(path)) {
                logger.info(`Blocked inactive subscription: tenant=${tenantId}, status=${status}, path=${path}`);
                throw new ForbiddenError(ENFORCEMENT_ERROR_CODES.SUBSCRIPTION_INACTIVE);
            }
            // Allow billing/auth routes even when inactive
            return next();
        }

        // 3. Feature Flag Gate
        const featureKey = req.enforcementContext?.featureKey || getFeatureKeyFromPath(path);
        if (featureKey) {
            const enabled = await configService.isFeatureEnabled(featureKey, {
                tenantId,
                userId: user?.id || 'system',
            });

            if (!enabled) {
                logger.info(`Feature disabled: tenant=${tenantId}, feature=${featureKey}`);
                throw new ForbiddenError(ENFORCEMENT_ERROR_CODES.FEATURE_DISABLED);
            }
        }

        // 4. Limit Gate (write operations only)
        if (isWriteMethod(method)) {
            const limitKey = req.enforcementContext?.limitKey || getLimitKeyFromPath(path);
            const currentCount = req.enforcementContext?.currentCount;

            if (limitKey && typeof currentCount === 'number') {
                const limit = await configService.getLimit(limitKey, {
                    tenantId,
                    userId: user?.id || 'system',
                });

                if (currentCount >= limit) {
                    logger.info(`Limit exceeded: tenant=${tenantId}, limit=${limitKey}, current=${currentCount}, max=${limit}`);
                    throw new ForbiddenError(ENFORCEMENT_ERROR_CODES.PLAN_LIMIT_EXCEEDED);
                }
            }
        }

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Factory to create enforcement middleware with specific feature/limit
 * Use this for routes that need explicit enforcement
 */
export function enforceFeature(featureKey: string) {
    return (req: Request, _res: Response, next: NextFunction) => {
        req.enforcementContext = req.enforcementContext || {};
        req.enforcementContext.featureKey = featureKey;
        next();
    };
}

/**
 * Factory to create limit enforcement middleware
 * Use this with a count resolver function
 */
export function enforceLimit(
    limitKey: string,
    countResolver: (req: Request) => Promise<number> | number
) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            req.enforcementContext = req.enforcementContext || {};
            req.enforcementContext.limitKey = limitKey;
            req.enforcementContext.currentCount = await countResolver(req);
            next();
        } catch (error) {
            next(error);
        }
    };
}
