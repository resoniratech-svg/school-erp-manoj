/**
 * Exams Types
 */
import type { ExamType, ExamStatus } from './exams.constants';

export interface ExamResponse {
    id: string;
    name: string;
    type: ExamType;
    status: ExamStatus;
    academicYearId: string;
    startDate: string;
    endDate: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateExamInput {
    name: string;
    type: ExamType;
    academicYearId: string;
    startDate: string;
    endDate: string;
    description?: string;
}

export interface UpdateExamInput {
    name?: string;
    type?: ExamType;
    startDate?: string;
    endDate?: string;
    description?: string | null;
    status?: ExamStatus;
}

export interface ExamContext {
    tenantId: string;
    branchId: string;
    userId: string;
}
