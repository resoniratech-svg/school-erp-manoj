/**
 * Fees Routes
 */
import { Router } from 'express';
import { feesController } from './fees.controller';
import { fullAuthMiddleware, requirePermission } from '../authz';
import { FEE_REPORT_PERMISSIONS } from './fees.constants';
import { structuresRoutes } from './structures';
import { assignmentsRoutes } from './assignments';
import { paymentsRoutes } from './payments';

const router = Router();

router.use(fullAuthMiddleware);

// Mount sub-routes
router.use('/structures', structuresRoutes);
router.use('/assignments', assignmentsRoutes);
router.use('/payments', paymentsRoutes);

// Reports
router.get(
    '/reports/collection',
    requirePermission(FEE_REPORT_PERMISSIONS.READ),
    feesController.getCollectionReport
);

router.get(
    '/reports/defaulters',
    requirePermission(FEE_REPORT_PERMISSIONS.READ),
    feesController.getDefaulters
);

export { router as feesRoutes };
