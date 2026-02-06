/**
 * Transport Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse, PaginatedResponse } from '../types/api-response';
import { buildQueryParams, type QueryParams } from '../types/pagination';

// Types
export interface Route {
    id: string;
    name: string;
    code?: string;
    description?: string;
    status?: string;
    startLocation?: string;
    endLocation?: string;
    stops?: RouteStop[];
    vehicleId?: string;
    driverId?: string;
}

export interface RouteStop {
    id: string;
    name: string;
    arrivalTime: string;
    sequence: number;
}

export interface Vehicle {
    id: string;
    registrationNumber: string;
    model?: string;
    capacity: number;
    currentOccupancy?: number;
    routeId?: string;
    route?: { id: string; name: string };
    type?: 'bus' | 'van' | 'other';
    status?: 'active' | 'maintenance' | 'inactive';
}

export interface TransportAssignment {
    id: string;
    studentId: string;
    routeId: string;
    stopId?: string;
    pickupStop?: string;
    dropStop?: string;
    status: string;
    student?: { id: string; name: string };
    route?: { id: string; name: string };
    stop?: { id: string; name: string };
}

/**
 * Transport Client
 */
export const transportClient = {
    /**
     * Routes
     */
    routes: {
        async list(params?: QueryParams): Promise<PaginatedResponse<Route>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<Route>>(
                `/api/v1/transport/routes${query}`
            );
            return response.data;
        },

        async get(id: string): Promise<Route> {
            const response = await apiClient.get<ApiResponse<Route>>(
                `/api/v1/transport/routes/${id}`
            );
            return response.data.data;
        },

        async create(data: Omit<Route, 'id'>): Promise<Route> {
            const response = await apiClient.post<ApiResponse<Route>>(
                '/api/v1/transport/routes',
                data
            );
            return response.data.data;
        },

        async update(id: string, data: Partial<Route>): Promise<Route> {
            const response = await apiClient.patch<ApiResponse<Route>>(
                `/api/v1/transport/routes/${id}`,
                data
            );
            return response.data.data;
        },

        async delete(id: string): Promise<void> {
            await apiClient.delete(`/api/v1/transport/routes/${id}`);
        },
    },

    /**
     * Vehicles
     */
    vehicles: {
        async list(params?: QueryParams): Promise<PaginatedResponse<Vehicle>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<Vehicle>>(
                `/api/v1/transport/vehicles${query}`
            );
            return response.data;
        },

        async get(id: string): Promise<Vehicle> {
            const response = await apiClient.get<ApiResponse<Vehicle>>(
                `/api/v1/transport/vehicles/${id}`
            );
            return response.data.data;
        },

        async create(data: Omit<Vehicle, 'id'>): Promise<Vehicle> {
            const response = await apiClient.post<ApiResponse<Vehicle>>(
                '/api/v1/transport/vehicles',
                data
            );
            return response.data.data;
        },

        async update(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
            const response = await apiClient.patch<ApiResponse<Vehicle>>(
                `/api/v1/transport/vehicles/${id}`,
                data
            );
            return response.data.data;
        },

        async delete(id: string): Promise<void> {
            await apiClient.delete(`/api/v1/transport/vehicles/${id}`);
        },
    },

    /**
     * Assignments
     */
    assignments: {
        async list(params?: QueryParams & { routeId?: string }): Promise<PaginatedResponse<TransportAssignment>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<TransportAssignment>>(
                `/api/v1/transport/assignments${query}`
            );
            return response.data;
        },

        async create(data: { studentId: string; routeId: string; stopId?: string }): Promise<TransportAssignment> {
            const response = await apiClient.post<ApiResponse<TransportAssignment>>(
                '/api/v1/transport/assignments',
                data
            );
            return response.data.data;
        },

        async getUnassignedStudents(params?: { limit?: number }): Promise<PaginatedResponse<{ id: string; name: string }>> {
            const query = buildQueryParams(params as any);
            const response = await apiClient.get<PaginatedResponse<{ id: string; name: string }>>(
                `/api/v1/transport/students/unassigned${query}`
            );
            return response.data;
        },

        async delete(id: string): Promise<void> {
            await apiClient.delete(`/api/v1/transport/assignments/${id}`);
        },

        async get(id: string): Promise<TransportAssignment> {
            const response = await apiClient.get<ApiResponse<TransportAssignment>>(
                `/api/v1/transport/assignments/${id}`
            );
            return response.data.data;
        },

        async unassign(id: string): Promise<void> {
            await apiClient.delete(`/api/v1/transport/assignments/${id}`);
        },

        async getByStudent(studentId: string): Promise<TransportAssignment | null> {
            const response = await apiClient.get<ApiResponse<TransportAssignment | null>>(
                `/api/v1/transport/assignments/student/${studentId}`
            );
            return response.data.data;
        },
    },
};
