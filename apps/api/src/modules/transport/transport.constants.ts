/**
 * Transport Module Constants
 */
import { createPermission } from '@school-erp/shared';

// Permissions
export const TRANSPORT_ROUTE_PERMISSIONS = {
    CREATE: createPermission('transport_route', 'create', 'branch'),
    READ: createPermission('transport_route', 'read', 'branch'),
    UPDATE: createPermission('transport_route', 'update', 'branch'),
    DELETE: createPermission('transport_route', 'delete', 'branch'),
} as const;

export const VEHICLE_PERMISSIONS = {
    CREATE: createPermission('vehicle', 'create', 'branch'),
    READ: createPermission('vehicle', 'read', 'branch'),
    UPDATE: createPermission('vehicle', 'update', 'branch'),
    DELETE: createPermission('vehicle', 'delete', 'branch'),
} as const;

export const TRANSPORT_ASSIGN_PERMISSIONS = {
    CREATE: createPermission('transport_assign', 'create', 'branch'),
    READ: createPermission('transport_assign', 'read', 'branch'),
    UPDATE: createPermission('transport_assign', 'update', 'branch'),
    DELETE: createPermission('transport_assign', 'delete', 'branch'),
} as const;

// Vehicle Status
export const VEHICLE_STATUS = {
    ACTIVE: 'active',
    MAINTENANCE: 'maintenance',
    RETIRED: 'retired',
} as const;

// Route Status
export const ROUTE_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

// Assignment Status
export const ASSIGNMENT_STATUS = {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
} as const;

// Error Codes
export const TRANSPORT_ERROR_CODES = {
    ROUTE_NOT_FOUND: 'TRANSPORT_ROUTE_NOT_FOUND',
    ROUTE_HAS_ACTIVE_ASSIGNMENTS: 'ROUTE_HAS_ACTIVE_ASSIGNMENTS',
    VEHICLE_NOT_FOUND: 'VEHICLE_NOT_FOUND',
    VEHICLE_CAPACITY_EXCEEDED: 'VEHICLE_CAPACITY_EXCEEDED',
    ASSIGNMENT_NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',
    STUDENT_ALREADY_ASSIGNED: 'STUDENT_ALREADY_ASSIGNED',
    STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND',
    CROSS_BRANCH_FORBIDDEN: 'CROSS_BRANCH_FORBIDDEN',
    INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
    STOP_NOT_FOUND: 'STOP_NOT_FOUND',
} as const;
