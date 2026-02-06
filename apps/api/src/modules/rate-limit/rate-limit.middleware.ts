/**
 * Rate Limit Middleware
 * Express middleware for enforcing rate limits
 */
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { rateLimitService } from './rate-limit.service';
import { RATE_LIMIT_HEADERS, RATE_LIMIT_ERROR_CODES } from './rate-limit.constants';
import { extractClientIp, shouldSkipRateLimit } from './rate-limit.utils';
import type { RateLimitContext, RateLimitOverride } from './rate-limit.types';

// Extend Request to include auth context
interface AuthenticatedRequest extends Request {
    tenant?: { id: string };
    branch?: { id: string };
    user?: { id: string };
    requestId?: string | string[];
}

/**
 * Create rate limit middleware with optional overrides
 */
export function rateLimit(override?: RateLimitOverride): RequestHandler {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Skip rate limiting for health checks
            if (shouldSkipRateLimit(req.path)) {
                next();
                return;
            }

            // Build context
            const context: RateLimitContext = {
                tenantId: req.tenant?.id,
                userId: req.user?.id,
                ip: extractClientIp(req),
                endpoint: req.path,
                method: req.method,
            };

            // Check rate limits
            const result = await rateLimitService.checkRateLimits(context, override);

            // Set rate limit headers
            res.set(RATE_LIMIT_HEADERS.LIMIT, result.limit.toString());
            res.set(RATE_LIMIT_HEADERS.REMAINING, result.remaining.toString());
            res.set(RATE_LIMIT_HEADERS.RESET, result.resetAt.toString());

            if (!result.allowed) {
                res.set(RATE_LIMIT_HEADERS.RETRY_AFTER, result.retryAfterSeconds?.toString() || '60');

                res.status(429).json({
                    success: false,
                    error: RATE_LIMIT_ERROR_CODES.RATE_LIMIT_EXCEEDED,
                    message: 'Too many requests. Please try again later.',
                    scope: result.scope,
                    retryAfterSeconds: result.retryAfterSeconds,
                    meta: {
                        requestId: req.requestId,
                    },
                });
                return;
            }

            next();
        } catch (error) {
            // Fail open - don't block requests due to rate limit errors
            next();
        }
    };
}

/**
 * Global rate limit middleware (default limits)
 */
export const rateLimitMiddleware: RequestHandler = rateLimit();

/**
 * Strict rate limit for auth endpoints
 */
export const authRateLimit: RequestHandler = rateLimit({
    ip: { perMinute: 5 },
    user: { perMinute: 10 },
});

/**
 * Very strict limit for password reset
 */
export const passwordResetRateLimit: RequestHandler = rateLimit({
    ip: { perMinute: 3 },
});
