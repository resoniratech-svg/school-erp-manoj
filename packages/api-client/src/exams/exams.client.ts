/**
 * Exams Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse, PaginatedResponse } from '../types/api-response';
import { buildQueryParams, type QueryParams } from '../types/pagination';

// Types
export interface Exam {
    id: string;
    name: string;
    type: 'unit' | 'midterm' | 'final' | 'practical';
    academicYearId: string;
    startDate: string;
    endDate: string;
    status: 'scheduled' | 'ongoing' | 'completed';
}

export interface ExamSchedule {
    id: string;
    examId: string;
    classId: string;
    subjectId: string;
    date: string;
    startTime: string;
    endTime: string;
    room?: string;
    maxMarks: number;
}

export interface Grade {
    id: string;
    studentId: string;
    examId: string;
    subjectId: string;
    marksObtained: number;
    maxMarks: number;
    grade?: string;
    remarks?: string;
}

export interface CreateExamInput {
    name: string;
    type: 'unit' | 'midterm' | 'final' | 'practical';
    academicYearId: string;
    startDate: string;
    endDate: string;
}

/**
 * Exams Client
 */
export const examsClient = {
    /**
     * Exams
     */
    async list(params?: QueryParams): Promise<PaginatedResponse<Exam>> {
        const query = buildQueryParams(params || {});
        const response = await apiClient.get<PaginatedResponse<Exam>>(
            `/api/v1/exams${query}`
        );
        return response.data;
    },

    async get(id: string): Promise<Exam> {
        const response = await apiClient.get<ApiResponse<Exam>>(`/api/v1/exams/${id}`);
        return response.data.data;
    },

    async create(data: CreateExamInput): Promise<Exam> {
        const response = await apiClient.post<ApiResponse<Exam>>('/api/v1/exams', data);
        return response.data.data;
    },

    async update(id: string, data: Partial<CreateExamInput>): Promise<Exam> {
        const response = await apiClient.patch<ApiResponse<Exam>>(
            `/api/v1/exams/${id}`,
            data
        );
        return response.data.data;
    },

    /**
     * Schedules
     */
    schedules: {
        async list(examId: string): Promise<ExamSchedule[]> {
            const response = await apiClient.get<ApiResponse<ExamSchedule[]>>(
                `/api/v1/exams/${examId}/schedules`
            );
            return response.data.data;
        },

        async create(examId: string, data: Omit<ExamSchedule, 'id' | 'examId'>): Promise<ExamSchedule> {
            const response = await apiClient.post<ApiResponse<ExamSchedule>>(
                `/api/v1/exams/${examId}/schedules`,
                data
            );
            return response.data.data;
        },

        async update(examId: string, scheduleId: string, data: Partial<ExamSchedule>): Promise<ExamSchedule> {
            const response = await apiClient.patch<ApiResponse<ExamSchedule>>(
                `/api/v1/exams/${examId}/schedules/${scheduleId}`,
                data
            );
            return response.data.data;
        },

        async delete(examId: string, scheduleId: string): Promise<void> {
            await apiClient.delete(`/api/v1/exams/${examId}/schedules/${scheduleId}`);
        },
    },

    /**
     * Grades
     */
    grades: {
        async list(examId: string, params?: { classId?: string; subjectId?: string }): Promise<Grade[]> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<ApiResponse<Grade[]>>(
                `/api/v1/exams/${examId}/grades${query}`
            );
            return response.data.data;
        },

        async record(examId: string, data: Omit<Grade, 'id' | 'examId'>): Promise<Grade> {
            const response = await apiClient.post<ApiResponse<Grade>>(
                `/api/v1/exams/${examId}/grades`,
                data
            );
            return response.data.data;
        },

        async bulkRecord(
            examId: string,
            grades: Array<Omit<Grade, 'id' | 'examId'>>
        ): Promise<Grade[]> {
            const response = await apiClient.post<ApiResponse<Grade[]>>(
                `/api/v1/exams/${examId}/grades/bulk`,
                { grades }
            );
            return response.data.data;
        },

        async update(examId: string, gradeId: string, data: Partial<Grade>): Promise<Grade> {
            const response = await apiClient.patch<ApiResponse<Grade>>(
                `/api/v1/exams/${examId}/grades/${gradeId}`,
                data
            );
            return response.data.data;
        },
    },
};
