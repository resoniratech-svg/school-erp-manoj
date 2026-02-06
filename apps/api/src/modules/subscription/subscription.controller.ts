/**
 * Subscription Controller
 * Route handlers for subscription operations
 */
import type { Request, Response, NextFunction } from 'express';
import { subscriptionService } from './subscription.service';
import { changePlanSchema } from './subscription.validator';
import type { SubscriptionContext } from './subscription.types';

/**
 * Get current subscription
 * GET /api/v1/subscription/current
 */
export async function getCurrentSubscription(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const subscription = await subscriptionService.getCurrentSubscription(context.tenantId);

        if (!subscription) {
            res.status(404).json({
                success: false,
                error: { code: 'SUBSCRIPTION_NOT_FOUND', message: 'No subscription found' },
            });
            return;
        }

        res.json({ success: true, data: subscription });
    } catch (error) {
        next(error);
    }
}

/**
 * List available plans
 * GET /api/v1/subscription/plans
 */
export async function listPlans(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const plans = await subscriptionService.listPlans();
        res.json({ success: true, data: plans });
    } catch (error) {
        next(error);
    }
}

/**
 * Change subscription plan
 * POST /api/v1/subscription/change-plan
 */
export async function changePlan(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const body = changePlanSchema.parse(req.body);

        const subscription = await subscriptionService.changePlan(
            context.tenantId,
            body.planCode,
            context
        );

        res.json({ success: true, data: subscription });
    } catch (error) {
        next(error);
    }
}

/**
 * Extract context from request
 */
function getContext(req: Request): SubscriptionContext {
    // Assumes auth middleware has populated req.user
    const user = (req as Request & { user?: { tenantId: string; id: string; branchId?: string } }).user;
    if (!user) {
        throw new Error('User context not found');
    }
    return {
        tenantId: user.tenantId,
        userId: user.id,
        branchId: user.branchId,
    };
}
