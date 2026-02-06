/**
 * Subscription Routes
 * Admin-only subscription management endpoints
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { SUBSCRIPTION_PERMISSIONS } from './subscription.constants';
import {
    getCurrentSubscription,
    listPlans,
    changePlan,
} from './subscription.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/subscription/current
 * Get current tenant subscription
 */
router.get(
    '/current',
    requirePermission(SUBSCRIPTION_PERMISSIONS.READ),
    getCurrentSubscription
);

/**
 * GET /api/v1/subscription/plans
 * List available subscription plans
 */
router.get(
    '/plans',
    requirePermission(SUBSCRIPTION_PERMISSIONS.READ),
    listPlans
);

/**
 * POST /api/v1/subscription/change-plan
 * Change subscription plan
 */
router.post(
    '/change-plan',
    requirePermission(SUBSCRIPTION_PERMISSIONS.UPDATE),
    changePlan
);

export default router;
