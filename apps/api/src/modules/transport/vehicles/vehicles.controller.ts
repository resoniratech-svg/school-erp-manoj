/**
 * Vehicles Sub-module Controller
 */
import { transportController } from '../transport.controller';

export const vehiclesController = {
    create: transportController.createVehicle,
    get: transportController.getVehicle,
    list: transportController.listVehicles,
    update: transportController.updateVehicle,
    delete: transportController.deleteVehicle,
};
