/**
 * Classes Types
 */

export interface ClassResponse {
    id: string;
    name: string;
    code: string;
    displayOrder: number;
    description: string | null;
    branchId: string;
    academicYearId: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClassWithRelations extends ClassResponse {
    academicYear: {
        id: string;
        name: string;
    };
    sectionsCount?: number;
}

export interface CreateClassInput {
    name: string;
    code: string;
    displayOrder: number;
    description?: string;
    branchId: string;
    academicYearId: string;
}

export interface UpdateClassInput {
    name?: string;
    code?: string;
    displayOrder?: number;
    description?: string | null;
}

export interface ClassListFilters {
    branchId: string;
    academicYearId: string;
    search?: string;
}

export interface ClassListOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters: ClassListFilters;
}

export interface PaginatedClassesResponse {
    classes: ClassResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ClassContext {
    tenantId: string;
    branchId: string;
    userId: string;
}
