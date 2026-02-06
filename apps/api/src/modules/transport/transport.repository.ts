/**
 * Transport Module Repository
 */
import { prisma } from '@school-erp/database';
import { ROUTE_STATUS, VEHICLE_STATUS, ASSIGNMENT_STATUS } from './transport.constants';
import type {
    CreateTransportRouteInput,
    UpdateTransportRouteInput,
    CreateVehicleInput,
    UpdateVehicleInput,
    CreateAssignmentInput,
    UpdateAssignmentInput,
    CreateRouteStopInput,
} from './transport.validator';

export class TransportRepository {
    // ==================== ROUTES ====================

    async findRouteById(id: string, tenantId: string, branchId: string) {
        return prisma.transportRoute.findFirst({
            where: { id, tenantId, branchId, deletedAt: null },
            include: {
                stops: { orderBy: { stopOrder: 'asc' } },
                vehicle: true,
                academicYear: true,
            },
        });
    }

    async findRoutes(
        tenantId: string,
        branchId: string,
        filters: { status?: string; academicYearId?: string }
    ) {
        return prisma.transportRoute.findMany({
            where: {
                tenantId,
                branchId,
                deletedAt: null,
                ...(filters.status && { status: filters.status }),
                ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
            },
            include: {
                stops: { orderBy: { stopOrder: 'asc' } },
                vehicle: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    async createRoute(
        data: CreateTransportRouteInput,
        tenantId: string,
        branchId: string,
        createdByUserId: string
    ) {
        const { stops, ...routeData } = data;

        return prisma.transportRoute.create({
            data: {
                ...routeData,
                tenantId,
                branchId,
                status: ROUTE_STATUS.ACTIVE,
                createdByUserId,
                stops: stops ? {
                    create: stops.map(stop => ({
                        ...stop,
                        tenantId,
                    })),
                } : undefined,
            },
            include: {
                stops: { orderBy: { stopOrder: 'asc' } },
                vehicle: true,
            },
        });
    }

    async updateRoute(id: string, data: UpdateTransportRouteInput) {
        return prisma.transportRoute.update({
            where: { id },
            data,
            include: {
                stops: { orderBy: { stopOrder: 'asc' } },
                vehicle: true,
            },
        });
    }

    async softDeleteRoute(id: string) {
        return prisma.transportRoute.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async countActiveAssignmentsForRoute(routeId: string): Promise<number> {
        return prisma.transportAssignment.count({
            where: {
                routeId,
                status: ASSIGNMENT_STATUS.ACTIVE,
                deletedAt: null,
            },
        });
    }

    async addStopToRoute(routeId: string, tenantId: string, stop: CreateRouteStopInput) {
        return prisma.routeStop.create({
            data: {
                ...stop,
                routeId,
                tenantId,
            },
        });
    }

    async findStopById(stopId: string) {
        return prisma.routeStop.findUnique({ where: { id: stopId } });
    }

    // ==================== VEHICLES ====================

    async findVehicleById(id: string, tenantId: string, branchId: string) {
        return prisma.vehicle.findFirst({
            where: { id, tenantId, branchId, deletedAt: null },
        });
    }

    async findVehicles(
        tenantId: string,
        branchId: string,
        filters: { status?: string }
    ) {
        return prisma.vehicle.findMany({
            where: {
                tenantId,
                branchId,
                deletedAt: null,
                ...(filters.status && { status: filters.status }),
            },
            orderBy: { vehicleNumber: 'asc' },
        });
    }

    async createVehicle(
        data: CreateVehicleInput,
        tenantId: string,
        branchId: string,
        createdByUserId: string
    ) {
        return prisma.vehicle.create({
            data: {
                ...data,
                tenantId,
                branchId,
                status: VEHICLE_STATUS.ACTIVE,
                createdByUserId,
            },
        });
    }

    async updateVehicle(id: string, data: UpdateVehicleInput) {
        return prisma.vehicle.update({
            where: { id },
            data,
        });
    }

    async softDeleteVehicle(id: string) {
        return prisma.vehicle.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async countActiveAssignmentsForVehicle(vehicleId: string): Promise<number> {
        // Count through route
        const routes = await prisma.transportRoute.findMany({
            where: { vehicleId, deletedAt: null },
            select: { id: true },
        });

        if (routes.length === 0) return 0;

        return prisma.transportAssignment.count({
            where: {
                routeId: { in: routes.map(r => r.id) },
                status: ASSIGNMENT_STATUS.ACTIVE,
                deletedAt: null,
            },
        });
    }

    // ==================== ASSIGNMENTS ====================

    async findAssignmentById(id: string, tenantId: string, branchId: string) {
        return prisma.transportAssignment.findFirst({
            where: { id, tenantId, branchId, deletedAt: null },
            include: {
                student: true,
                route: { include: { stops: true } },
                pickupStop: true,
                dropStop: true,
            },
        });
    }

    async findAssignments(
        tenantId: string,
        branchId: string,
        filters: { routeId?: string; studentId?: string; status?: string }
    ) {
        return prisma.transportAssignment.findMany({
            where: {
                tenantId,
                branchId,
                deletedAt: null,
                ...(filters.routeId && { routeId: filters.routeId }),
                ...(filters.studentId && { studentId: filters.studentId }),
                ...(filters.status && { status: filters.status }),
            },
            include: {
                student: true,
                route: true,
                pickupStop: true,
                dropStop: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findActiveAssignmentForStudent(studentId: string): Promise<boolean> {
        const count = await prisma.transportAssignment.count({
            where: {
                studentId,
                status: ASSIGNMENT_STATUS.ACTIVE,
                deletedAt: null,
            },
        });
        return count > 0;
    }

    async createAssignment(
        data: CreateAssignmentInput,
        tenantId: string,
        branchId: string,
        createdByUserId: string
    ) {
        return prisma.transportAssignment.create({
            data: {
                studentId: data.studentId,
                routeId: data.routeId,
                pickupStopId: data.pickupStopId || null,
                dropStopId: data.dropStopId || null,
                effectiveFrom: new Date(data.effectiveFrom),
                effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
                tenantId,
                branchId,
                status: ASSIGNMENT_STATUS.ACTIVE,
                createdByUserId,
            },
            include: {
                student: true,
                route: true,
                pickupStop: true,
                dropStop: true,
            },
        });
    }

    async updateAssignment(id: string, data: UpdateAssignmentInput) {
        return prisma.transportAssignment.update({
            where: { id },
            data: {
                ...(data.pickupStopId && { pickupStopId: data.pickupStopId }),
                ...(data.dropStopId && { dropStopId: data.dropStopId }),
                ...(data.effectiveTo && { effectiveTo: new Date(data.effectiveTo) }),
                ...(data.status && { status: data.status }),
            },
            include: {
                student: true,
                route: true,
                pickupStop: true,
                dropStop: true,
            },
        });
    }

    async softDeleteAssignment(id: string) {
        return prisma.transportAssignment.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                status: ASSIGNMENT_STATUS.CANCELLED,
            },
        });
    }

    // ==================== HELPERS ====================

    async findStudentById(studentId: string, tenantId: string) {
        return prisma.student.findFirst({
            where: { id: studentId, tenantId, deletedAt: null },
        });
    }

    async findAcademicYearById(academicYearId: string, tenantId: string) {
        return prisma.academicYear.findFirst({
            where: { id: academicYearId, tenantId },
        });
    }

    async getVehicleOccupancy(vehicleId: string): Promise<number> {
        // Get routes with this vehicle
        const routes = await prisma.transportRoute.findMany({
            where: { vehicleId, deletedAt: null },
            select: { id: true },
        });

        if (routes.length === 0) return 0;

        return prisma.transportAssignment.count({
            where: {
                routeId: { in: routes.map(r => r.id) },
                status: ASSIGNMENT_STATUS.ACTIVE,
                deletedAt: null,
            },
        });
    }
}

export const transportRepository = new TransportRepository();
