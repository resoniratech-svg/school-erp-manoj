/**
 * Sections Mapper
 * Transform Prisma models to API response DTOs
 */
import type { SectionResponse, SectionWithRelations } from './sections.types';

type SectionFromDb = {
    id: string;
    classId: string;
    name: string;
    code: string;
    capacity: number | null;
    room: string | null;
    classTeacherId: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
};

type SectionFromDbWithRelations = SectionFromDb & {
    class: {
        id: string;
        name: string;
        code: string;
        tenantId: string;
        branchId: string;
    };
    classTeacher: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
};

export function toSectionResponse(section: SectionFromDb): SectionResponse {
    return {
        id: section.id,
        name: section.name,
        code: section.code,
        capacity: section.capacity,
        room: section.room,
        classId: section.classId,
        classTeacherId: section.classTeacherId,
        createdAt: section.createdAt.toISOString(),
        updatedAt: section.updatedAt.toISOString(),
    };
}

export function toSectionWithRelationsResponse(
    section: SectionFromDbWithRelations
): SectionWithRelations {
    return {
        ...toSectionResponse(section),
        class: {
            id: section.class.id,
            name: section.class.name,
            code: section.class.code,
        },
        classTeacher: section.classTeacher
            ? {
                id: section.classTeacher.id,
                firstName: section.classTeacher.firstName,
                lastName: section.classTeacher.lastName,
            }
            : null,
    };
}

export function toSectionResponseList(sections: SectionFromDb[]): SectionResponse[] {
    return sections.map(toSectionResponse);
}
