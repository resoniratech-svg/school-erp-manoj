/**
 * Rate Limit Routes
 * READ-ONLY status endpoint
 */
import { Router } from 'express';
import { rateLimitController } from './rate-limit.controller';
import { fullAuthMiddleware, requirePermission } from '../authz';
import { RATE_LIMIT_PERMISSIONS } from './rate-limit.constants';

const router = Router();

router.use(fullAuthMiddleware);

// GET /rate-limit/status - Admin only
router.get(
    '/status',
    requirePermission(RATE_LIMIT_PERMISSIONS.READ_STATUS),
    rateLimitController.getStatus
);

// NO create, update, delete routes - READ ONLY

export { router as rateLimitRoutes };
