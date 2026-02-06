/**
 * Transport Routes Sub-module Service
 */
import { transportService } from '../transport.service';
import type { TransportRouteResponse, TransportContext } from '../transport.types';
import type { CreateTransportRouteInput, UpdateTransportRouteInput, CreateRouteStopInput } from '../transport.validator';

export class RoutesService {
    async create(input: CreateTransportRouteInput, context: TransportContext): Promise<TransportRouteResponse> {
        return transportService.createRoute(input, context);
    }

    async getById(id: string, context: TransportContext): Promise<TransportRouteResponse> {
        return transportService.getRouteById(id, context);
    }

    async list(
        filters: { status?: string; academicYearId?: string },
        context: TransportContext
    ): Promise<TransportRouteResponse[]> {
        return transportService.listRoutes(filters, context);
    }

    async update(id: string, input: UpdateTransportRouteInput, context: TransportContext): Promise<TransportRouteResponse> {
        return transportService.updateRoute(id, input, context);
    }

    async delete(id: string, context: TransportContext): Promise<void> {
        return transportService.deleteRoute(id, context);
    }

    async addStop(routeId: string, stop: CreateRouteStopInput, context: TransportContext): Promise<TransportRouteResponse> {
        return transportService.addStopToRoute(routeId, stop, context);
    }
}

export const routesService = new RoutesService();
