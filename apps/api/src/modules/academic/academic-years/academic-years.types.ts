/**
 * Academic Years Types
 */
import type { AcademicYearStatus } from './academic-years.constants';

export interface AcademicYearResponse {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    status: AcademicYearStatus;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAcademicYearInput {
    name: string;
    startDate: string;
    endDate: string;
    status?: AcademicYearStatus;
}

export interface UpdateAcademicYearInput {
    name?: string;
    startDate?: string;
    endDate?: string;
    status?: AcademicYearStatus;
}

export interface AcademicYearListFilters {
    status?: AcademicYearStatus;
    isCurrent?: boolean;
    search?: string;
}

export interface AcademicYearListOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: AcademicYearListFilters;
}

export interface PaginatedAcademicYearsResponse {
    academicYears: AcademicYearResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface AcademicYearContext {
    tenantId: string;
    userId: string;
}
