/**
 * Sections Types
 */

export interface SectionResponse {
    id: string;
    name: string;
    code: string;
    capacity: number | null;
    room: string | null;
    classId: string;
    classTeacherId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface SectionWithRelations extends SectionResponse {
    class: {
        id: string;
        name: string;
        code: string;
    };
    classTeacher: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
}

export interface CreateSectionInput {
    name: string;
    code: string;
    capacity?: number;
    room?: string;
    classId: string;
    classTeacherId?: string;
}

export interface UpdateSectionInput {
    name?: string;
    code?: string;
    capacity?: number | null;
    room?: string | null;
}

export interface AssignClassTeacherInput {
    classTeacherId: string | null;
}

export interface SectionListFilters {
    classId: string;
    search?: string;
}

export interface SectionListOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters: SectionListFilters;
}

export interface PaginatedSectionsResponse {
    sections: SectionResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface SectionContext {
    tenantId: string;
    branchId: string;
    userId: string;
}
