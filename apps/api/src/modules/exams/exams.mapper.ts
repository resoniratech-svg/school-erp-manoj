/**
 * Exams Mapper
 */
import type { ExamResponse } from './exams.types';
import type { ExamType, ExamStatus } from './exams.constants';

type ExamFromDb = {
    id: string;
    name: string;
    type: string;
    status: string;
    academicYearId: string;
    startDate: Date;
    endDate: Date;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export function toExamResponse(exam: ExamFromDb): ExamResponse {
    return {
        id: exam.id,
        name: exam.name,
        type: exam.type as ExamType,
        status: exam.status as ExamStatus,
        academicYearId: exam.academicYearId,
        startDate: exam.startDate.toISOString().split('T')[0],
        endDate: exam.endDate.toISOString().split('T')[0],
        description: exam.description,
        createdAt: exam.createdAt.toISOString(),
        updatedAt: exam.updatedAt.toISOString(),
    };
}
