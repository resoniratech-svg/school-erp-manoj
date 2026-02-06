/**
 * Periods Routes
 * Express router with RBAC middleware
 */
import { Router } from 'express';
import { periodsController } from './periods.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { PERIOD_PERMISSIONS } from './periods.constants';
import {
    createPeriodSchema,
    updatePeriodSchema,
    periodIdParamSchema,
    listPeriodsSchema,
} from './periods.validator';

const router = Router();

// Apply auth middleware to all routes
router.use(fullAuthMiddleware);

// Create period
router.post(
    '/',
    requirePermission(PERIOD_PERMISSIONS.CREATE),
    validate(createPeriodSchema),
    periodsController.createPeriod
);

// List periods
router.get(
    '/',
    requirePermission(PERIOD_PERMISSIONS.READ),
    validate(listPeriodsSchema),
    periodsController.listPeriods
);

// Get period by ID
router.get(
    '/:id',
    requirePermission(PERIOD_PERMISSIONS.READ),
    validate(periodIdParamSchema),
    periodsController.getPeriod
);

// Update period
router.patch(
    '/:id',
    requirePermission(PERIOD_PERMISSIONS.UPDATE),
    validate(updatePeriodSchema),
    periodsController.updatePeriod
);

// Delete period
router.delete(
    '/:id',
    requirePermission(PERIOD_PERMISSIONS.DELETE),
    validate(periodIdParamSchema),
    periodsController.deletePeriod
);

export { router as periodsRoutes };
