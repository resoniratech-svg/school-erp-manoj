/**
 * Communication Routes
 */
import { Router } from 'express';
import { fullAuthMiddleware } from '../authz';
import { announcementsRoutes } from './announcements';
import { notificationsRoutes } from './notifications';

const router = Router();

router.use(fullAuthMiddleware);

// Mount sub-routes
router.use('/announcements', announcementsRoutes);
router.use('/notifications', notificationsRoutes);

export { router as communicationRoutes };
