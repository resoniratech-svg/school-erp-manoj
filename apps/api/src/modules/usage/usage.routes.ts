/**
 * Usage Routes
 * Read-only usage endpoints
 * NO POST, NO PUT, NO DELETE
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { USAGE_PERMISSIONS } from './usage.constants';
import { getUsageSummary, getUsageByMetric } from './usage.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/usage/summary
 * Get usage summary with limits
 */
router.get(
    '/summary',
    requirePermission(USAGE_PERMISSIONS.READ),
    getUsageSummary
);

/**
 * GET /api/v1/usage/:metric
 * Get usage for a specific metric
 */
router.get(
    '/:metric',
    requirePermission(USAGE_PERMISSIONS.READ),
    getUsageByMetric
);

// NO POST - usage is incremented internally
// NO PUT - no updates
// NO DELETE - append-only

export default router;
