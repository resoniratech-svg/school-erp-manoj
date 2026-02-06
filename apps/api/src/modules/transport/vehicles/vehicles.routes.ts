/**
 * Vehicles Sub-module Routes
 */
import { Router } from 'express';
import { vehiclesController } from './vehicles.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { VEHICLE_PERMISSIONS } from '../transport.constants';
import {
    createVehicleSchema,
    updateVehicleSchema,
    vehicleIdParamSchema,
    listVehiclesSchema,
} from '../transport.validator';

const router = Router();

router.use(fullAuthMiddleware);

router.post(
    '/',
    requirePermission(VEHICLE_PERMISSIONS.CREATE),
    validate(createVehicleSchema),
    vehiclesController.create
);

router.get(
    '/',
    requirePermission(VEHICLE_PERMISSIONS.READ),
    validate(listVehiclesSchema),
    vehiclesController.list
);

router.get(
    '/:id',
    requirePermission(VEHICLE_PERMISSIONS.READ),
    validate(vehicleIdParamSchema),
    vehiclesController.get
);

router.patch(
    '/:id',
    requirePermission(VEHICLE_PERMISSIONS.UPDATE),
    validate(updateVehicleSchema),
    vehiclesController.update
);

router.delete(
    '/:id',
    requirePermission(VEHICLE_PERMISSIONS.DELETE),
    validate(vehicleIdParamSchema),
    vehiclesController.delete
);

export { router as vehiclesRoutes };
