/**
 * Subjects Mapper
 * Transform Prisma models to API response DTOs
 */
import type { SubjectResponse } from './subjects.types';
import type { SubjectType } from './subjects.constants';

type SubjectFromDb = {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    type: string;
    creditHours: number | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
};

export function toSubjectResponse(subject: SubjectFromDb): SubjectResponse {
    return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        type: subject.type as SubjectType,
        creditHours: subject.creditHours,
        description: subject.description,
        createdAt: subject.createdAt.toISOString(),
        updatedAt: subject.updatedAt.toISOString(),
    };
}

export function toSubjectResponseList(subjects: SubjectFromDb[]): SubjectResponse[] {
    return subjects.map(toSubjectResponse);
}
