/**
 * Transport Routes Sub-module Routes
 */
import { Router } from 'express';
import { routesController } from './routes.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { TRANSPORT_ROUTE_PERMISSIONS } from '../transport.constants';
import {
    createTransportRouteSchema,
    updateTransportRouteSchema,
    routeIdParamSchema,
    listRoutesSchema,
    addStopSchema,
} from '../transport.validator';

const router = Router();

router.use(fullAuthMiddleware);

router.post(
    '/',
    requirePermission(TRANSPORT_ROUTE_PERMISSIONS.CREATE),
    validate(createTransportRouteSchema),
    routesController.create
);

router.get(
    '/',
    requirePermission(TRANSPORT_ROUTE_PERMISSIONS.READ),
    validate(listRoutesSchema),
    routesController.list
);

router.get(
    '/:id',
    requirePermission(TRANSPORT_ROUTE_PERMISSIONS.READ),
    validate(routeIdParamSchema),
    routesController.get
);

router.patch(
    '/:id',
    requirePermission(TRANSPORT_ROUTE_PERMISSIONS.UPDATE),
    validate(updateTransportRouteSchema),
    routesController.update
);

router.delete(
    '/:id',
    requirePermission(TRANSPORT_ROUTE_PERMISSIONS.DELETE),
    validate(routeIdParamSchema),
    routesController.delete
);

router.post(
    '/:id/stops',
    requirePermission(TRANSPORT_ROUTE_PERMISSIONS.UPDATE),
    validate(addStopSchema),
    routesController.addStop
);

export { router as transportRoutesRoutes };
