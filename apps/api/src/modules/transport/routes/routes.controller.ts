/**
 * Transport Routes Sub-module Controller
 */
import { transportController } from '../transport.controller';

export const routesController = {
    create: transportController.createRoute,
    get: transportController.getRoute,
    list: transportController.listRoutes,
    update: transportController.updateRoute,
    delete: transportController.deleteRoute,
    addStop: transportController.addStop,
};
