/**
 * Class-Subjects Types
 */

export interface ClassSubjectResponse {
    classId: string;
    subjectId: string;
    isMandatory: boolean;
    periodsPerWeek: number | null;
    createdAt: string;
    subject: {
        id: string;
        name: string;
        code: string;
        type: string;
    };
}

export interface AssignSubjectInput {
    subjectId: string;
    isMandatory?: boolean;
    periodsPerWeek?: number;
}

export interface ClassSubjectContext {
    tenantId: string;
    branchId: string;
    userId: string;
}
