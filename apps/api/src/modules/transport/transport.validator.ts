/**
 * Transport Module Validators
 */
import { z } from 'zod';
import { VEHICLE_STATUS, ROUTE_STATUS, ASSIGNMENT_STATUS } from './transport.constants';

// Route Stop Schema
const routeStopSchema = z.object({
    name: z.string().min(1).max(100),
    address: z.string().max(500).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    pickupTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM').optional(),
    dropTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM').optional(),
    stopOrder: z.number().int().min(1),
});

// Create Route
export const createTransportRouteSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        startPoint: z.string().min(1).max(200),
        endPoint: z.string().min(1).max(200),
        academicYearId: z.string().uuid(),
        vehicleId: z.string().uuid().optional(),
        stops: z.array(routeStopSchema).optional(),
    }),
});

// Update Route
export const updateTransportRouteSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        startPoint: z.string().min(1).max(200).optional(),
        endPoint: z.string().min(1).max(200).optional(),
        status: z.enum([ROUTE_STATUS.ACTIVE, ROUTE_STATUS.INACTIVE]).optional(),
        vehicleId: z.string().uuid().optional(),
    }),
});

// Create Vehicle
export const createVehicleSchema = z.object({
    body: z.object({
        vehicleNumber: z.string().min(1).max(20),
        capacity: z.number().int().min(1).max(100),
        model: z.string().max(100).optional(),
        driverName: z.string().max(100).optional(),
        driverPhone: z.string().max(20).optional(),
        helperName: z.string().max(100).optional(),
        helperPhone: z.string().max(20).optional(),
    }),
});

// Update Vehicle
export const updateVehicleSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        vehicleNumber: z.string().min(1).max(20).optional(),
        capacity: z.number().int().min(1).max(100).optional(),
        model: z.string().max(100).optional(),
        status: z.enum([VEHICLE_STATUS.ACTIVE, VEHICLE_STATUS.MAINTENANCE, VEHICLE_STATUS.RETIRED]).optional(),
        driverName: z.string().max(100).optional(),
        driverPhone: z.string().max(20).optional(),
        helperName: z.string().max(100).optional(),
        helperPhone: z.string().max(20).optional(),
    }),
});

// Create Assignment
export const createAssignmentSchema = z.object({
    body: z.object({
        studentId: z.string().uuid(),
        routeId: z.string().uuid(),
        pickupStopId: z.string().uuid().optional(),
        dropStopId: z.string().uuid().optional(),
        effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
        effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
    }).refine(
        (data) => !data.effectiveTo || new Date(data.effectiveFrom) <= new Date(data.effectiveTo),
        { message: 'effectiveFrom must be before or equal to effectiveTo' }
    ),
});

// Update Assignment
export const updateAssignmentSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        pickupStopId: z.string().uuid().optional(),
        dropStopId: z.string().uuid().optional(),
        effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
        status: z.enum([ASSIGNMENT_STATUS.ACTIVE, ASSIGNMENT_STATUS.EXPIRED, ASSIGNMENT_STATUS.CANCELLED]).optional(),
    }),
});

// Common Params
export const routeIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

export const vehicleIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

export const assignmentIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

// List Queries
export const listRoutesSchema = z.object({
    query: z.object({
        status: z.enum([ROUTE_STATUS.ACTIVE, ROUTE_STATUS.INACTIVE]).optional(),
        academicYearId: z.string().uuid().optional(),
    }),
});

export const listVehiclesSchema = z.object({
    query: z.object({
        status: z.enum([VEHICLE_STATUS.ACTIVE, VEHICLE_STATUS.MAINTENANCE, VEHICLE_STATUS.RETIRED]).optional(),
    }),
});

export const listAssignmentsSchema = z.object({
    query: z.object({
        routeId: z.string().uuid().optional(),
        studentId: z.string().uuid().optional(),
        status: z.enum([ASSIGNMENT_STATUS.ACTIVE, ASSIGNMENT_STATUS.EXPIRED, ASSIGNMENT_STATUS.CANCELLED]).optional(),
    }),
});

// Add Stop Schema
export const addStopSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: routeStopSchema,
});

// Type exports
export type CreateTransportRouteInput = z.infer<typeof createTransportRouteSchema>['body'];
export type UpdateTransportRouteInput = z.infer<typeof updateTransportRouteSchema>['body'];
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>['body'];
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>['body'];
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>['body'];
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>['body'];
export type CreateRouteStopInput = z.infer<typeof routeStopSchema>;
