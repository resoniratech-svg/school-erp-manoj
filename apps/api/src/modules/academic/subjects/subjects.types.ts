/**
 * Subjects Types
 */
import type { SubjectType } from './subjects.constants';

export interface SubjectResponse {
    id: string;
    name: string;
    code: string;
    type: SubjectType;
    creditHours: number | null;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSubjectInput {
    name: string;
    code: string;
    type: SubjectType;
    creditHours?: number;
    description?: string;
}

export interface UpdateSubjectInput {
    name?: string;
    code?: string;
    type?: SubjectType;
    creditHours?: number | null;
    description?: string | null;
}

export interface SubjectListFilters {
    type?: SubjectType;
    search?: string;
}

export interface SubjectListOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: SubjectListFilters;
}

export interface PaginatedSubjectsResponse {
    subjects: SubjectResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface SubjectContext {
    tenantId: string;
    userId: string;
}
