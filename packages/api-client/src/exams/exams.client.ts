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
    type: string;
    description?: string;
    academicYearId: string;
    startDate: string;
    endDate: string;
    status: 'scheduled' | 'ongoing' | 'completed' | 'draft' | 'published';
}

export interface ExamSchedule {
    id: string;
    examId: string;
    classId: string;
    subjectId: string;
    date: string;
    startTime: string;
    endTime: string;
    maxMarks: number;
    exam?: { id: string; name: string };
    subject?: { id: string; name: string };
    class?: { id: string; name: string };
    section?: { id: string; name: string };
    sectionId?: string;
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
    type: string;
    description?: string;
    academicYearId?: string;
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

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/api/v1/exams/${id}`);
    },

    async publish(id: string): Promise<Exam> {
        const response = await apiClient.post<ApiResponse<Exam>>(
            `/api/v1/exams/${id}/publish`,
            {}
        );
        return response.data.data;
    },

    async archive(id: string): Promise<Exam> {
        const response = await apiClient.post<ApiResponse<Exam>>(
            `/api/v1/exams/${id}/archive`,
            {}
        );
        return response.data.data;
    },

    schedules: {
        async list(params: QueryParams & { examId?: string }): Promise<PaginatedResponse<ExamSchedule>> {
            const { examId, ...rest } = params;
            const query = buildQueryParams(rest);
            const url = examId
                ? `/api/v1/exams/${examId}/schedules${query}`
                : `/api/v1/exams/schedules${query}`;
            const response = await apiClient.get<PaginatedResponse<ExamSchedule>>(url);
            return response.data;
        },

        async create(data: Omit<ExamSchedule, 'id'>): Promise<ExamSchedule> {
            const { examId, ...rest } = data;
            const response = await apiClient.post<ApiResponse<ExamSchedule>>(
                `/api/v1/exams/${examId}/schedules`,
                rest
            );
            return response.data.data;
        },

        async update(id: string, data: Partial<ExamSchedule>): Promise<ExamSchedule> {
            // If examId is in data, we can use it, otherwise we might need a different endpoint
            // For now, let's assume we have examId or a flat endpoint
            const response = await apiClient.patch<ApiResponse<ExamSchedule>>(
                `/api/v1/exams/schedules/${id}`,
                data
            );
            return response.data.data;
        },

        async delete(id: string): Promise<void> {
            await apiClient.delete(`/api/v1/exams/schedules/${id}`);
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

    /**
     * Marks
     */
    marks: {
        async get(params: { scheduleId: string }): Promise<{ entries: any[] }> {
            const response = await apiClient.get<ApiResponse<{ entries: any[] }>>(
                `/api/v1/exams/schedules/${params.scheduleId}/marks`
            );
            return response.data.data;
        },

        async saveBulk(data: { scheduleId: string; entries: any[] }): Promise<void> {
            await apiClient.post(
                `/api/v1/exams/schedules/${data.scheduleId}/marks/bulk`,
                { entries: data.entries }
            );
        },
    },
};
