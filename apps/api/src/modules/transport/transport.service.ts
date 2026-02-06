/**
 * Transport Module Service
 * CRITICAL: Enforces capacity limits and single-assignment rule
 */
import { NotFoundError, ConflictError } from '@school-erp/shared';
import { TransportRepository, transportRepository } from './transport.repository';
import { TRANSPORT_ERROR_CODES } from './transport.constants';
import {
    mapRouteToResponse,
    mapVehicleToResponse,
    mapAssignmentToResponse,
} from './transport.mapper';
import type {
    TransportRouteResponse,
    VehicleResponse,
    TransportAssignmentResponse,
    TransportContext,
} from './transport.types';
import type {
    CreateTransportRouteInput,
    UpdateTransportRouteInput,
    CreateVehicleInput,
    UpdateVehicleInput,
    CreateAssignmentInput,
    UpdateAssignmentInput,
    CreateRouteStopInput,
} from './transport.validator';
import { getLogger } from '../../utils/logger';

const logger = getLogger('transport-service');

export class TransportService {
    constructor(private readonly repository: TransportRepository = transportRepository) { }

    // ==================== ROUTES ====================

    async createRoute(
        input: CreateTransportRouteInput,
        context: TransportContext
    ): Promise<TransportRouteResponse> {
        // Validate academic year
        const academicYear = await this.repository.findAcademicYearById(
            input.academicYearId,
            context.tenantId
        );
        if (!academicYear) {
            throw new NotFoundError('Academic year not found');
        }

        // Validate vehicle if provided
        if (input.vehicleId) {
            const vehicle = await this.repository.findVehicleById(
                input.vehicleId,
                context.tenantId,
                context.branchId
            );
            if (!vehicle) {
                throw new NotFoundError(TRANSPORT_ERROR_CODES.VEHICLE_NOT_FOUND);
            }
        }

        const route = await this.repository.createRoute(
            input,
            context.tenantId,
            context.branchId,
            context.userId
        );

        logger.info(`Transport route created: ${route.id} in branch ${context.branchId}`);
        return mapRouteToResponse(route);
    }

    async getRouteById(id: string, context: TransportContext): Promise<TransportRouteResponse> {
        const route = await this.repository.findRouteById(id, context.tenantId, context.branchId);
        if (!route) {
            throw new NotFoundError(TRANSPORT_ERROR_CODES.ROUTE_NOT_FOUND);
        }
        return mapRouteToResponse(route);
    }

    async listRoutes(
        filters: { status?: string; academicYearId?: string },
        context: TransportContext
    ): Promise<TransportRouteResponse[]> {
        const routes = await this.repository.findRoutes(context.tenantId, context.branchId, filters);
        return routes.map((r: Parameters<typeof mapRouteToResponse>[0]) => mapRouteToResponse(r));
    }

    async updateRoute(
        id: string,
        input: UpdateTransportRouteInput,
        context: TransportContext
    ): Promise<TransportRouteResponse> {
        const existing = await this.repository.findRouteById(id, context.tenantId, context.branchId);
        if (!existing) {
            throw new NotFoundError(TRANSPORT_ERROR_CODES.ROUTE_NOT_FOUND);
        }

        // Validate vehicle if provided
        if (input.vehicleId) {
            const vehicle = await this.repository.findVehicleById(
                input.vehicleId,
                context.tenantId,
                context.branchId
            );
            if (!vehicle) {
                throw new NotFoundError(TRANSPORT_ERROR_CODES.VEHICLE_NOT_FOUND);
            }
        }

        const updated = await this.repository.updateRoute(id, input);
        logger.info(`Transport route updated: ${id}`);
        return mapRouteToResponse(updated);
    }

    async deleteRoute(id: string, context: TransportContext): Promise<void> {
        const existing = await this.repository.findRouteById(id, context.tenantId, context.branchId);
        if (!existing) {
            throw new NotFoundError(TRANSPORT_ERROR_CODES.ROUTE_NOT_FOUND);
        }

        // CRITICAL: Cannot delete route with active students
        const activeCount = await this.repository.countActiveAssignmentsForRoute(id);
        if (activeCount > 0) {
            throw new ConflictError(
                `Cannot delete route with ${activeCount} active student assignments`
            );
        }

        await this.repository.softDeleteRoute(id);
        logger.info(`Transport route deleted: ${id}`);
    }

    async addStopToRoute(
        routeId: string,
        stop: CreateRouteStopInput,
        context: TransportContext
    ): Promise<TransportRouteResponse> {
        const route = await this.repository.findRouteById(routeId, context.tenantId, context.branchId);
        if (!route) {
            throw new NotFoundError(TRANSPORT_ERROR_CODES.ROUTE_NOT_FOUND);
        }

        await this.repository.addStopToRoute(routeId, context.tenantId, stop);

        const updated = await this.repository.findRouteById(routeId, context.tenantId, context.branchId);
        return mapRouteToResponse(updated!);
    }

    // ==================== VEHICLES ====================

    async createVehicle(
        input: CreateVehicleInput,
        context: TransportContext
    ): Promise<VehicleResponse> {
        const vehicle = await this.repository.createVehicle(
            input,
            context.tenantId,
            context.branchId,
            context.userId
        );

        logger.info(`Vehicle created: ${vehicle.id}`);
        return mapVehicleToResponse(vehicle, 0);
    }

    async getVehicleById(id: string, context: TransportContext): Promise<VehicleResponse> {
        const vehicle = await this.repository.findVehicleById(id, context.tenantId, context.branchId);
        if (!vehicle) {
            throw new NotFoundError(TRANSPORT_ERROR_CODES.VEHICLE_NOT_FOUND);
        }

        const occupancy = await this.repository.getVehicleOccupancy(id);
        return mapVehicleToResponse(vehicle, occupancy);
    }

    async listVehicles(
        filters: { status?: string },
        context: TransportContext
    ): Promise<VehicleResponse[]> {
        const vehicles = await this.repository.findVehicles(context.tenantId, context.branchId, filters);

        // Get occupancy for each vehicle
        const results: VehicleResponse[] = [];
        for (const vehicle of vehicles) {
            const occupancy = await this.repository.getVehicleOccupancy(vehicle.id);
            results.push(mapVehicleToResponse(vehicle, occupancy));
        }

        return results;
    }

    async updateVehicle(
        id: string,
        input: UpdateVehicleInput,
        context: TransportContext
    ): Promise<VehicleResponse> {
        const existing = await this.repository.findVehicleById(id, context.tenantId, context.branchId);
        if (!existing) {
            throw new NotFoundError(TRANSPORT_ERROR_CODES.VEHICLE_NOT_FOUND);
        }

        // CRITICAL: Check capacity if being reduced
        if (input.capacity !== undefined && input.capacity < existing.capacity) {
            const currentOccupancy = await this.repository.getVehicleOccupancy(id);
            if (currentOccupancy > input.capacity) {
                throw new ConflictError(
                    `Cannot reduce capacity to ${input.capacity} as current occupancy is ${currentOccupancy}`
                );
            }
        }

        const updated = await this.repository.updateVehicle(id, input);
        const occupancy = await this.repository.getVehicleOccupancy(id);

        logger.info(`Vehicle updated: ${id}`);
        return mapVehicleToResponse(updated, occupancy);
    }

    async deleteVehicle(id: string, context: TransportContext): Promise<void> {
        const existing = await this.repository.findVehicleById(id, context.tenantId, context.branchId);
        if (!existing) {
            throw new NotFoundError(TRANSPORT_ERROR_CODES.VEHICLE_NOT_FOUND);
        }

        await this.repository.softDeleteVehicle(id);
        logger.info(`Vehicle deleted: ${id}`);
    }

    // ==================== ASSIGNMENTS ====================

    async createAssignment(
        input: CreateAssignmentInput,
        context: TransportContext
    ): Promise<TransportAssignmentResponse> {
        // Validate student exists and belongs to tenant
        const student = await this.repository.findStudentById(input.studentId, context.tenantId);
        if (!student) {
            throw new NotFoundError(TRANSPORT_ERROR_CODES.STUDENT_NOT_FOUND);
        }

        // Validate route exists and belongs to branch
        const route = await this.repository.findRouteById(
            input.routeId,
            context.tenantId,
            context.branchId
        );
        if (!route) {
            throw new NotFoundError(TRANSPORT_ERROR_CODES.ROUTE_NOT_FOUND);
        }

        // CRITICAL: Check if student already has active assignment
        const hasActiveAssignment = await this.repository.findActiveAssignmentForStudent(input.studentId);
        if (hasActiveAssignment) {
            throw new ConflictError(
                'Student already has an active transport assignment'
            );
        }

        // CRITICAL: Check vehicle capacity
        if (route.vehicle) {
            const currentOccupancy = await this.repository.getVehicleOccupancy(route.vehicle.id);
            if (currentOccupancy >= route.vehicle.capacity) {
                throw new ConflictError(
                    `Vehicle capacity (${route.vehicle.capacity}) has been reached`
                );
            }
        }

        // Validate stops if provided
        if (input.pickupStopId) {
            const stop = await this.repository.findStopById(input.pickupStopId);
            if (!stop || stop.routeId !== input.routeId) {
                throw new NotFoundError(TRANSPORT_ERROR_CODES.STOP_NOT_FOUND);
            }
        }
        if (input.dropStopId) {
            const stop = await this.repository.findStopById(input.dropStopId);
            if (!stop || stop.routeId !== input.routeId) {
                throw new NotFoundError(TRANSPORT_ERROR_CODES.STOP_NOT_FOUND);
            }
        }

        const assignment = await this.repository.createAssignment(
            input,
            context.tenantId,
            context.branchId,
            context.userId
        );

        logger.info(`Transport assignment created: ${assignment.id} for student ${input.studentId}`);
        return mapAssignmentToResponse(assignment);
    }

    async getAssignmentById(id: string, context: TransportContext): Promise<TransportAssignmentResponse> {
        const assignment = await this.repository.findAssignmentById(
            id,
            context.tenantId,
            context.branchId
        );
        if (!assignment) {
            throw new NotFoundError(TRANSPORT_ERROR_CODES.ASSIGNMENT_NOT_FOUND);
        }
        return mapAssignmentToResponse(assignment);
    }

    async listAssignments(
        filters: { routeId?: string; studentId?: string; status?: string },
        context: TransportContext
    ): Promise<TransportAssignmentResponse[]> {
        const assignments = await this.repository.findAssignments(
            context.tenantId,
            context.branchId,
            filters
        );
        return assignments.map(mapAssignmentToResponse);
    }

    async updateAssignment(
        id: string,
        input: UpdateAssignmentInput,
        context: TransportContext
    ): Promise<TransportAssignmentResponse> {
        const existing = await this.repository.findAssignmentById(
            id,
            context.tenantId,
            context.branchId
        );
        if (!existing) {
            throw new NotFoundError(TRANSPORT_ERROR_CODES.ASSIGNMENT_NOT_FOUND);
        }

        // Validate stops if provided
        if (input.pickupStopId) {
            const stop = await this.repository.findStopById(input.pickupStopId);
            if (!stop || stop.routeId !== existing.routeId) {
                throw new NotFoundError(TRANSPORT_ERROR_CODES.STOP_NOT_FOUND);
            }
        }
        if (input.dropStopId) {
            const stop = await this.repository.findStopById(input.dropStopId);
            if (!stop || stop.routeId !== existing.routeId) {
                throw new NotFoundError(TRANSPORT_ERROR_CODES.STOP_NOT_FOUND);
            }
        }

        const updated = await this.repository.updateAssignment(id, input);
        logger.info(`Transport assignment updated: ${id}`);
        return mapAssignmentToResponse(updated);
    }

    async cancelAssignment(id: string, context: TransportContext): Promise<void> {
        const existing = await this.repository.findAssignmentById(
            id,
            context.tenantId,
            context.branchId
        );
        if (!existing) {
            throw new NotFoundError(TRANSPORT_ERROR_CODES.ASSIGNMENT_NOT_FOUND);
        }

        await this.repository.softDeleteAssignment(id);
        logger.info(`Transport assignment cancelled: ${id}`);
    }
}

export const transportService = new TransportService();
