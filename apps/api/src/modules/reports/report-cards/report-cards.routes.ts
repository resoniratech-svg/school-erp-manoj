/**
 * Report Cards Routes
 */
import { Router } from 'express';
import { reportCardsController } from './report-cards.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { REPORT_PERMISSIONS } from '../reports.constants';
import {
    generateReportCardSchema,
    bulkGenerateReportCardsSchema,
    publishReportCardSchema,
    reportCardIdParamSchema,
    listReportCardsSchema,
} from '../reports.validator';

const router = Router();

router.use(fullAuthMiddleware);

// Generate single
router.post(
    '/',
    requirePermission(REPORT_PERMISSIONS.GENERATE),
    validate(generateReportCardSchema),
    reportCardsController.generate
);

// Bulk generate
router.post(
    '/bulk',
    requirePermission(REPORT_PERMISSIONS.GENERATE),
    validate(bulkGenerateReportCardsSchema),
    reportCardsController.bulkGenerate
);

// List
router.get(
    '/',
    requirePermission(REPORT_PERMISSIONS.READ),
    validate(listReportCardsSchema),
    reportCardsController.list
);

// Get by ID
router.get(
    '/:id',
    requirePermission(REPORT_PERMISSIONS.READ),
    validate(reportCardIdParamSchema),
    reportCardsController.get
);

// Publish
router.post(
    '/:id/publish',
    requirePermission(REPORT_PERMISSIONS.PUBLISH),
    validate(publishReportCardSchema),
    reportCardsController.publish
);

export { router as reportCardsRoutes };
