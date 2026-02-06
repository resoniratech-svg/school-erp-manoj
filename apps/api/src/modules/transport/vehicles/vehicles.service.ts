/**
 * Vehicles Sub-module Service
 */
import { transportService } from '../transport.service';
import type { VehicleResponse, TransportContext } from '../transport.types';
import type { CreateVehicleInput, UpdateVehicleInput } from '../transport.validator';

export class VehiclesService {
    async create(input: CreateVehicleInput, context: TransportContext): Promise<VehicleResponse> {
        return transportService.createVehicle(input, context);
    }

    async getById(id: string, context: TransportContext): Promise<VehicleResponse> {
        return transportService.getVehicleById(id, context);
    }

    async list(filters: { status?: string }, context: TransportContext): Promise<VehicleResponse[]> {
        return transportService.listVehicles(filters, context);
    }

    async update(id: string, input: UpdateVehicleInput, context: TransportContext): Promise<VehicleResponse> {
        return transportService.updateVehicle(id, input, context);
    }

    async delete(id: string, context: TransportContext): Promise<void> {
        return transportService.deleteVehicle(id, context);
    }
}

export const vehiclesService = new VehiclesService();
