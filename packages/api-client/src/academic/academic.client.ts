/**
 * Academic Client
 * Academic years, classes, sections, subjects
 */
import { apiClient } from '../core/axios';
import type { ApiResponse, PaginatedResponse } from '../types/api-response';
import { buildQueryParams, type QueryParams } from '../types/pagination';

// Types
export interface AcademicYear {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    isCurrent?: boolean;
    tenantId: string;
}

export interface Class {
    id: string;
    name: string;
    grade: number;
    branchId: string;
    academicYearId: string;
    sections: Section[];
    code?: string;
    academicYear?: AcademicYear;
    status?: string;
}

export interface Section {
    id: string;
    name: string;
    classId: string;
    capacity: number;
    teacherId?: string;
    code?: string;
    class?: Class;
    classTeacher?: { id: string; name: string };
    status?: string;
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    type: 'core' | 'elective' | 'extra';
    credits?: number;
}

export interface CreateAcademicYearInput {
    name: string;
    startDate: Date;
    endDate: Date;
}

export interface CreateClassInput {
    name: string;
    grade: number;
    branchId?: string;
    academicYearId: string;
    code?: string;
}

export interface CreateSectionInput {
    name: string;
    classId: string;
    capacity: number;
    teacherId?: string;
    code?: string;
}

export interface CreateSubjectInput {
    name: string;
    code: string;
    type: 'core' | 'elective' | 'extra';
    credits?: number;
}

/**
 * Academic Client
 */
export const academicClient = {
    /**
     * Academic Years
     */
    years: {
        async list(params?: QueryParams): Promise<PaginatedResponse<AcademicYear>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<AcademicYear>>(
                `/api/v1/academic/years${query}`
            );
            return response.data;
        },

        async get(id: string): Promise<AcademicYear> {
            const response = await apiClient.get<ApiResponse<AcademicYear>>(
                `/api/v1/academic/years/${id}`
            );
            return response.data.data;
        },

        async create(data: CreateAcademicYearInput): Promise<AcademicYear> {
            const response = await apiClient.post<ApiResponse<AcademicYear>>(
                '/api/v1/academic/years',
                data
            );
            return response.data.data;
        },

        async update(id: string, data: Partial<CreateAcademicYearInput>): Promise<AcademicYear> {
            const response = await apiClient.patch<ApiResponse<AcademicYear>>(
                `/api/v1/academic/years/${id}`,
                data
            );
            return response.data.data;
        },

        async activate(id: string): Promise<AcademicYear> {
            const response = await apiClient.post<ApiResponse<AcademicYear>>(
                `/api/v1/academic/years/${id}/activate`
            );
            return response.data.data;
        },

        async getActive(): Promise<AcademicYear | null> {
            const response = await apiClient.get<ApiResponse<AcademicYear | null>>(
                '/api/v1/academic/years/active'
            );
            return response.data.data;
        },
    },

    /**
     * Classes
     */
    classes: {
        async list(params?: QueryParams & { branchId?: string; academicYearId?: string }): Promise<PaginatedResponse<Class>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<Class>>(
                `/api/v1/academic/classes${query}`
            );
            return response.data;
        },

        async get(id: string): Promise<Class> {
            const response = await apiClient.get<ApiResponse<Class>>(
                `/api/v1/academic/classes/${id}`
            );
            return response.data.data;
        },

        async create(data: CreateClassInput): Promise<Class> {
            const response = await apiClient.post<ApiResponse<Class>>(
                '/api/v1/academic/classes',
                data
            );
            return response.data.data;
        },

        async update(id: string, data: Partial<CreateClassInput>): Promise<Class> {
            const response = await apiClient.patch<ApiResponse<Class>>(
                `/api/v1/academic/classes/${id}`,
                data
            );
            return response.data.data;
        },

        async delete(id: string): Promise<void> {
            await apiClient.delete(`/api/v1/academic/classes/${id}`);
        },
    },

    /**
     * Sections
     */
    sections: {
        async get(id: string): Promise<Section> {
            const response = await apiClient.get<ApiResponse<Section>>(
                `/api/v1/academic/sections/${id}`
            );
            return response.data.data;
        },

        async list(params?: QueryParams & { classId?: string }): Promise<PaginatedResponse<Section>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<Section>>(
                `/api/v1/academic/sections${query}`
            );
            return response.data;
        },

        async listByClass(classId: string): Promise<Section[]> {
            const response = await apiClient.get<ApiResponse<Section[]>>(
                `/api/v1/academic/classes/${classId}/sections`
            );
            return response.data.data;
        },

        async create(data: CreateSectionInput): Promise<Section> {
            const response = await apiClient.post<ApiResponse<Section>>(
                '/api/v1/academic/sections',
                data
            );
            return response.data.data;
        },

        async update(id: string, data: Partial<CreateSectionInput>): Promise<Section> {
            const response = await apiClient.patch<ApiResponse<Section>>(
                `/api/v1/academic/sections/${id}`,
                data
            );
            return response.data.data;
        },

        async delete(id: string): Promise<void> {
            await apiClient.delete(`/api/v1/academic/sections/${id}`);
        },
    },

    /**
     * Subjects
     */
    subjects: {
        async list(params?: QueryParams & { type?: string }): Promise<PaginatedResponse<Subject>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<Subject>>(
                `/api/v1/academic/subjects${query}`
            );
            return response.data;
        },

        async get(id: string): Promise<Subject> {
            const response = await apiClient.get<ApiResponse<Subject>>(
                `/api/v1/academic/subjects/${id}`
            );
            return response.data.data;
        },

        async create(data: CreateSubjectInput): Promise<Subject> {
            const response = await apiClient.post<ApiResponse<Subject>>(
                '/api/v1/academic/subjects',
                data
            );
            return response.data.data;
        },

        async update(id: string, data: Partial<CreateSubjectInput>): Promise<Subject> {
            const response = await apiClient.patch<ApiResponse<Subject>>(
                `/api/v1/academic/subjects/${id}`,
                data
            );
            return response.data.data;
        },

        async delete(id: string): Promise<void> {
            await apiClient.delete(`/api/v1/academic/subjects/${id}`);
        },
    },
};
