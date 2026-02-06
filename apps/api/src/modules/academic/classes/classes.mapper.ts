/**
 * Classes Mapper
 * Transform Prisma models to API response DTOs
 */
import type { ClassResponse, ClassWithRelations } from './classes.types';

type ClassFromDb = {
    id: string;
    tenantId: string;
    branchId: string;
    academicYearId: string;
    name: string;
    code: string;
    displayOrder: number;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
};

type ClassFromDbWithRelations = ClassFromDb & {
    academicYear: {
        id: string;
        name: string;
    };
    _count?: {
        sections: number;
    };
};

export function toClassResponse(classEntity: ClassFromDb): ClassResponse {
    return {
        id: classEntity.id,
        name: classEntity.name,
        code: classEntity.code,
        displayOrder: classEntity.displayOrder,
        description: classEntity.description,
        branchId: classEntity.branchId,
        academicYearId: classEntity.academicYearId,
        createdAt: classEntity.createdAt.toISOString(),
        updatedAt: classEntity.updatedAt.toISOString(),
    };
}

export function toClassWithRelationsResponse(
    classEntity: ClassFromDbWithRelations
): ClassWithRelations {
    return {
        ...toClassResponse(classEntity),
        academicYear: {
            id: classEntity.academicYear.id,
            name: classEntity.academicYear.name,
        },
        sectionsCount: classEntity._count?.sections,
    };
}

export function toClassResponseList(classes: ClassFromDb[]): ClassResponse[] {
    return classes.map(toClassResponse);
}
