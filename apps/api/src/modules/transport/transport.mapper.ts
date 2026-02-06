/**
 * Transport Module Mapper
 */
import type {
    TransportRouteResponse,
    RouteStopResponse,
    VehicleResponse,
    TransportAssignmentResponse,
} from './transport.types';

type RouteWithRelations = {
    id: string;
    name: string;
    description: string | null;
    startPoint: string;
    endPoint: string;
    status: string;
    academicYearId: string;
    branchId: string;
    createdAt: Date;
    updatedAt: Date;
    stops?: Array<{
        id: string;
        name: string;
        address: string | null;
        latitude: number | null;
        longitude: number | null;
        pickupTime: string | null;
        dropTime: string | null;
        stopOrder: number;
    }>;
    vehicle?: {
        id: string;
        vehicleNumber: string;
        capacity: number;
        model: string | null;
        status: string;
        driverName: string | null;
        driverPhone: string | null;
        helperName: string | null;
        helperPhone: string | null;
        branchId: string;
        createdAt: Date;
        updatedAt: Date;
    } | null;
};

type VehicleRecord = {
    id: string;
    vehicleNumber: string;
    capacity: number;
    model: string | null;
    status: string;
    driverName: string | null;
    driverPhone: string | null;
    helperName: string | null;
    helperPhone: string | null;
    branchId: string;
    createdAt: Date;
    updatedAt: Date;
};

type AssignmentWithRelations = {
    id: string;
    studentId: string;
    routeId: string;
    pickupStopId: string | null;
    dropStopId: string | null;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    student?: { firstName: string; lastName: string };
    route?: { name: string };
};

export function mapRouteToResponse(
    route: RouteWithRelations,
    occupancy?: number
): TransportRouteResponse {
    return {
        id: route.id,
        name: route.name,
        description: route.description,
        startPoint: route.startPoint,
        endPoint: route.endPoint,
        status: route.status,
        academicYearId: route.academicYearId,
        branchId: route.branchId,
        stops: route.stops?.map(mapStopToResponse) || [],
        vehicle: route.vehicle ? mapVehicleToResponse(route.vehicle, occupancy) : null,
        createdAt: route.createdAt,
        updatedAt: route.updatedAt,
    };
}

export function mapStopToResponse(
    stop: NonNullable<RouteWithRelations['stops']>[0]
): RouteStopResponse {
    return {
        id: stop.id,
        name: stop.name,
        address: stop.address,
        latitude: stop.latitude,
        longitude: stop.longitude,
        pickupTime: stop.pickupTime,
        dropTime: stop.dropTime,
        stopOrder: stop.stopOrder,
    };
}

export function mapVehicleToResponse(
    vehicle: VehicleRecord,
    currentOccupancy: number = 0
): VehicleResponse {
    return {
        id: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        capacity: vehicle.capacity,
        model: vehicle.model,
        status: vehicle.status,
        driverName: vehicle.driverName,
        driverPhone: vehicle.driverPhone,
        helperName: vehicle.helperName,
        helperPhone: vehicle.helperPhone,
        branchId: vehicle.branchId,
        currentOccupancy,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
    };
}

export function mapAssignmentToResponse(
    assignment: AssignmentWithRelations
): TransportAssignmentResponse {
    return {
        id: assignment.id,
        studentId: assignment.studentId,
        studentName: assignment.student
            ? `${assignment.student.firstName} ${assignment.student.lastName}`
            : '',
        routeId: assignment.routeId,
        routeName: assignment.route?.name || '',
        pickupStopId: assignment.pickupStopId,
        dropStopId: assignment.dropStopId,
        effectiveFrom: assignment.effectiveFrom,
        effectiveTo: assignment.effectiveTo,
        status: assignment.status,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
    };
}
