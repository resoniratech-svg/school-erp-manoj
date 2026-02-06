/**
 * Notification Delivery Routes
 * READ + RETRY only
 */
import { Router } from 'express';
import { deliveryController } from './notification-delivery.controller';
import { validate } from '../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../authz';
import { DELIVERY_PERMISSIONS } from './notification-delivery.constants';
import {
    listDeliveriesSchema,
    deliveryIdParamSchema,
    retryDeliverySchema,
} from './notification-delivery.validator';

const router = Router();

router.use(fullAuthMiddleware);

// GET /notification-delivery - List deliveries
router.get(
    '/',
    requirePermission(DELIVERY_PERMISSIONS.READ),
    validate(listDeliveriesSchema),
    deliveryController.listDeliveries
);

// GET /notification-delivery/:id - Get delivery by ID
router.get(
    '/:id',
    requirePermission(DELIVERY_PERMISSIONS.READ),
    validate(deliveryIdParamSchema),
    deliveryController.getDelivery
);

// POST /notification-delivery/:id/retry - Retry failed delivery
router.post(
    '/:id/retry',
    requirePermission(DELIVERY_PERMISSIONS.RETRY),
    validate(retryDeliverySchema),
    deliveryController.retryDelivery
);

// NO POST /notification-delivery (create) - deliveries are created internally
// NO DELETE - append-only

export { router as deliveryRoutes };
