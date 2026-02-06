/**
 * Announcements Routes
 */
import { Router } from 'express';
import { announcementsController } from './announcements.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { ANNOUNCEMENT_PERMISSIONS } from '../communication.constants';
import {
    createAnnouncementSchema,
    updateAnnouncementSchema,
    announcementIdParamSchema,
    listAnnouncementsSchema,
} from '../communication.validator';

const router = Router();

router.use(fullAuthMiddleware);

router.post(
    '/',
    requirePermission(ANNOUNCEMENT_PERMISSIONS.CREATE),
    validate(createAnnouncementSchema),
    announcementsController.create
);

router.get(
    '/',
    requirePermission(ANNOUNCEMENT_PERMISSIONS.READ),
    validate(listAnnouncementsSchema),
    announcementsController.list
);

router.get(
    '/:id',
    requirePermission(ANNOUNCEMENT_PERMISSIONS.READ),
    validate(announcementIdParamSchema),
    announcementsController.get
);

router.patch(
    '/:id',
    requirePermission(ANNOUNCEMENT_PERMISSIONS.CREATE),
    validate(updateAnnouncementSchema),
    announcementsController.update
);

router.post(
    '/:id/publish',
    requirePermission(ANNOUNCEMENT_PERMISSIONS.PUBLISH),
    validate(announcementIdParamSchema),
    announcementsController.publish
);

router.post(
    '/:id/archive',
    requirePermission(ANNOUNCEMENT_PERMISSIONS.CREATE),
    validate(announcementIdParamSchema),
    announcementsController.archive
);

export { router as announcementsRoutes };
