/**
 * Transport Module Types
 */

// Transport Route
export interface TransportRouteResponse {
    id: string;
    name: string;
    description: string | null;
    startPoint: string;
    endPoint: string;
    status: string;
    academicYearId: string;
    branchId: string;
    stops: RouteStopResponse[];
    vehicle: VehicleResponse | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface RouteStopResponse {
    id: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    pickupTime: string | null;
    dropTime: string | null;
    stopOrder: number;
}

// Vehicle
export interface VehicleResponse {
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
    currentOccupancy: number;
    createdAt: Date;
    updatedAt: Date;
}

// Student Assignment
export interface TransportAssignmentResponse {
    id: string;
    studentId: string;
    studentName: string;
    routeId: string;
    routeName: string;
    pickupStopId: string | null;
    dropStopId: string | null;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

// Context
export interface TransportContext {
    tenantId: string;
    branchId: string;
    userId: string;
}

// Create inputs
export interface CreateTransportRouteInput {
    name: string;
    description?: string;
    startPoint: string;
    endPoint: string;
    academicYearId: string;
    vehicleId?: string;
    stops?: CreateRouteStopInput[];
}

export interface CreateRouteStopInput {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    pickupTime?: string;
    dropTime?: string;
    stopOrder: number;
}

export interface CreateVehicleInput {
    vehicleNumber: string;
    capacity: number;
    model?: string;
    driverName?: string;
    driverPhone?: string;
    helperName?: string;
    helperPhone?: string;
}

export interface CreateAssignmentInput {
    studentId: string;
    routeId: string;
    pickupStopId?: string;
    dropStopId?: string;
    effectiveFrom: string;
    effectiveTo?: string;
}

// Update inputs
export interface UpdateTransportRouteInput {
    name?: string;
    description?: string;
    startPoint?: string;
    endPoint?: string;
    status?: string;
    vehicleId?: string;
}

export interface UpdateVehicleInput {
    vehicleNumber?: string;
    capacity?: number;
    model?: string;
    status?: string;
    driverName?: string;
    driverPhone?: string;
    helperName?: string;
    helperPhone?: string;
}

export interface UpdateAssignmentInput {
    pickupStopId?: string;
    dropStopId?: string;
    effectiveTo?: string;
    status?: string;
}
