/**
 * Users API Client Extension
 * Add to @school-erp/api-client if not present
 */
import { apiClient } from '../core/axios';
import type { ApiResponse, PaginatedResponse } from '../types/api-response';
import { buildQueryParams, type QueryParams } from '../types/pagination';

// Types
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: 'active' | 'inactive';
    role: string;
    roles: UserRole[];
    branches: UserBranch[];
    tenantId: string;
    createdAt: Date;
}

export interface UserRole {
    id: string;
    name: string;
}

export interface UserBranch {
    id: string;
    name: string;
}

export interface CreateUserInput {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    status?: 'active' | 'inactive';
    roleIds?: string[];
    branchIds?: string[];
}

export interface UpdateUserInput {
    firstName?: string;
    lastName?: string;
    status?: 'active' | 'inactive';
    roleIds?: string[];
    branchIds?: string[];
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    type: 'system' | 'custom';
    permissions: string[];
    tenantId: string;
    createdAt: Date;
}

export interface CreateRoleInput {
    name: string;
    description?: string;
    permissions: string[];
}

export interface Permission {
    key: string;
    name: string;
    module: string;
    description?: string;
}

/**
 * Users Client
 */
export const usersClient = {
    async list(params?: QueryParams & { status?: string }): Promise<PaginatedResponse<User>> {
        const query = buildQueryParams(params || {});
        const response = await apiClient.get<PaginatedResponse<User>>(
            `/api/v1/users${query}`
        );
        return response.data;
    },

    async get(id: string): Promise<User> {
        const response = await apiClient.get<ApiResponse<User>>(`/api/v1/users/${id}`);
        return response.data.data;
    },

    async create(data: CreateUserInput): Promise<User> {
        const response = await apiClient.post<ApiResponse<User>>('/api/v1/users', data);
        return response.data.data;
    },

    async update(id: string, data: UpdateUserInput): Promise<User> {
        const response = await apiClient.patch<ApiResponse<User>>(
            `/api/v1/users/${id}`,
            data
        );
        return response.data.data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/api/v1/users/${id}`);
    },

    async assignRoles(id: string, roleIds: string[]): Promise<User> {
        const response = await apiClient.post<ApiResponse<User>>(
            `/api/v1/users/${id}/roles`,
            { roleIds }
        );
        return response.data.data;
    },

    async assignBranches(id: string, branchIds: string[]): Promise<User> {
        const response = await apiClient.post<ApiResponse<User>>(
            `/api/v1/users/${id}/branches`,
            { branchIds }
        );
        return response.data.data;
    },
};

/**
 * Roles Client
 */
export const rolesClient = {
    async list(params?: QueryParams): Promise<PaginatedResponse<Role>> {
        const query = buildQueryParams(params || {});
        const response = await apiClient.get<PaginatedResponse<Role>>(
            `/api/v1/roles${query}`
        );
        return response.data;
    },

    async get(id: string): Promise<Role> {
        const response = await apiClient.get<ApiResponse<Role>>(`/api/v1/roles/${id}`);
        return response.data.data;
    },

    async create(data: CreateRoleInput): Promise<Role> {
        const response = await apiClient.post<ApiResponse<Role>>('/api/v1/roles', data);
        return response.data.data;
    },

    async update(id: string, data: Partial<CreateRoleInput>): Promise<Role> {
        const response = await apiClient.patch<ApiResponse<Role>>(
            `/api/v1/roles/${id}`,
            data
        );
        return response.data.data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/api/v1/roles/${id}`);
    },

    async getPermissions(): Promise<Permission[]> {
        const response = await apiClient.get<ApiResponse<Permission[]>>(
            '/api/v1/roles/permissions'
        );
        return response.data.data;
    },
};
