/**
 * Notifications Routes
 * NO DELETE ENDPOINT - Notifications are immutable
 */
import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { NOTIFICATION_PERMISSIONS } from '../communication.constants';
import {
    sendNotificationSchema,
    bulkSendNotificationSchema,
    notificationIdParamSchema,
    listNotificationsSchema,
} from '../communication.validator';

const router = Router();

router.use(fullAuthMiddleware);

// Send notifications
router.post(
    '/',
    requirePermission(NOTIFICATION_PERMISSIONS.SEND),
    validate(sendNotificationSchema),
    notificationsController.send
);

router.post(
    '/bulk',
    requirePermission(NOTIFICATION_PERMISSIONS.SEND),
    validate(bulkSendNotificationSchema),
    notificationsController.sendBulk
);

// List notifications
router.get(
    '/',
    requirePermission(NOTIFICATION_PERMISSIONS.READ),
    validate(listNotificationsSchema),
    notificationsController.list
);

// User's own notifications
router.get(
    '/me',
    notificationsController.getUserNotifications
);

// Mark as read
router.post(
    '/:id/read',
    validate(notificationIdParamSchema),
    notificationsController.markAsRead
);

router.post(
    '/read-all',
    notificationsController.markAllAsRead
);

// NO DELETE ROUTE

export { router as notificationsRoutes };
