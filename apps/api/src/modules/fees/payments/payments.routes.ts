/**
 * Payments Routes
 * CRITICAL: NO DELETE ENDPOINT - Append-only
 */
import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { FEE_PAYMENT_PERMISSIONS } from '../fees.constants';
import {
    recordPaymentSchema,
    paymentIdParamSchema,
    listPaymentsSchema,
} from '../fees.validator';

const router = Router();

router.use(fullAuthMiddleware);

// Record payment (append-only)
router.post(
    '/',
    requirePermission(FEE_PAYMENT_PERMISSIONS.RECORD),
    validate(recordPaymentSchema),
    paymentsController.record
);

// List payments
router.get(
    '/',
    requirePermission(FEE_PAYMENT_PERMISSIONS.READ),
    validate(listPaymentsSchema),
    paymentsController.list
);

// Get payment by ID
router.get(
    '/:id',
    requirePermission(FEE_PAYMENT_PERMISSIONS.READ),
    validate(paymentIdParamSchema),
    paymentsController.get
);

// NO DELETE ROUTE - Payments are immutable

export { router as paymentsRoutes };
