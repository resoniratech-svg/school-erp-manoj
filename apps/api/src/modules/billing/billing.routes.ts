/**
 * Billing Routes
 * Payment endpoints with proper auth
 */
import { Router, json } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { BILLING_PERMISSIONS } from './billing.constants';
import { createOrder, webhook, getPayments } from './billing.controller';

const router = Router();

/**
 * POST /api/v1/billing/webhook
 * Razorpay webhook - NO AUTH required
 * Uses raw body parser for signature verification
 */
router.post(
    '/webhook',
    json({
        verify: (req, _res, buf) => {
            // Store raw body for signature verification
            (req as Request & { rawBody?: Buffer }).rawBody = buf;
        },
    }),
    webhook
);

// Authenticated routes
router.use(authenticate);

/**
 * POST /api/v1/billing/create-order
 * Create Razorpay order for plan upgrade
 */
router.post(
    '/create-order',
    requirePermission(BILLING_PERMISSIONS.CREATE_ORDER),
    createOrder
);

/**
 * GET /api/v1/billing/payments
 * Get payment history for tenant
 */
router.get(
    '/payments',
    requirePermission(BILLING_PERMISSIONS.CREATE_ORDER),
    getPayments
);

export default router;
