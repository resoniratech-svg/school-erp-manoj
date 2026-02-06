/**
 * Rate Limit Controller
 * READ-ONLY status endpoint for admins
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@school-erp/shared';
import { rateLimitService } from './rate-limit.service';
import { getRequestContext } from '../authz';

// Extend Request type
interface AuthenticatedRequest extends Request {
    requestId?: string | string[];
}

export class RateLimitController {
    /**
     * GET /rate-limit/status - Get rate limit status
     */
    getStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);

            const status = await rateLimitService.getStatus(
                context.tenant.id,
                context.branch?.id
            );

            res.status(200).json(
                createApiResponse(status, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    // NO create, update, delete endpoints - READ ONLY
}

export const rateLimitController = new RateLimitController();
