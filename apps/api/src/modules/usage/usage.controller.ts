/**
 * Usage Controller
 * Read-only API for usage data
 */
import type { Request, Response, NextFunction } from 'express';
import { usageService } from './usage.service';
import { usageMetricSchema } from './usage.validator';
import type { UsageContext } from './usage.types';

/**
 * Get usage summary with limits
 * GET /api/v1/usage/summary
 */
export async function getUsageSummary(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const summary = await usageService.getUsageWithLimits(context);
        res.json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
}

/**
 * Get usage for a specific metric
 * GET /api/v1/usage/:metric
 */
export async function getUsageByMetric(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const metric = usageMetricSchema.parse(req.params.metric);

        const used = await usageService.getUsage(context.tenantId, metric);
        const isAtLimit = await usageService.isAtLimit(context.tenantId, metric, context);

        res.json({
            success: true,
            data: {
                metric,
                used,
                isAtLimit,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Extract context from request
 */
function getContext(req: Request): UsageContext {
    const user = (req as Request & { user?: { tenantId: string; id: string } }).user;
    if (!user) {
        throw new Error('User context not found');
    }
    return {
        tenantId: user.tenantId,
        userId: user.id,
    };
}
