/**
 * Reports Routes
 */
import { Router } from 'express';
import { reportsController } from './reports.controller';
import { validate } from '../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../authz';
import { REPORT_PERMISSIONS } from './reports.constants';
import { reportCardsRoutes } from './report-cards';
import { transcriptsRoutes } from './transcripts';

const router = Router();

router.use(fullAuthMiddleware);

// Mount sub-routes
router.use('/report-cards', reportCardsRoutes);
router.use('/transcripts', transcriptsRoutes);

// Promotion eligibility check
router.get(
    '/promotion/:studentId',
    requirePermission(REPORT_PERMISSIONS.READ),
    reportsController.checkPromotionEligibility
);

export { router as reportsRoutes };
