/**
 * Timetable Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse } from '../types/api-response';

// Types
export interface TimetableSlot {
    id: string;
    classId: string;
    sectionId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: number; // 0-6
    startTime: string;
    endTime: string;
    room?: string;
}

export interface CreateSlotInput {
    classId: string;
    sectionId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
}

export interface TimetableView {
    classId: string;
    sectionId: string;
    slots: TimetableSlot[];
}

/**
 * Timetable Client
 */
export const timetableClient = {
    /**
     * Get timetable for class/section
     */
    async getByClass(classId: string, sectionId?: string): Promise<TimetableView> {
        const params = sectionId ? `?sectionId=${sectionId}` : '';
        const response = await apiClient.get<ApiResponse<TimetableView>>(
            `/api/v1/timetable/class/${classId}${params}`
        );
        return response.data.data;
    },

    /**
     * Get timetable for teacher
     */
    async getByTeacher(teacherId: string): Promise<TimetableSlot[]> {
        const response = await apiClient.get<ApiResponse<TimetableSlot[]>>(
            `/api/v1/timetable/teacher/${teacherId}`
        );
        return response.data.data;
    },

    /**
     * Create slot
     */
    async createSlot(data: CreateSlotInput): Promise<TimetableSlot> {
        const response = await apiClient.post<ApiResponse<TimetableSlot>>(
            '/api/v1/timetable/slots',
            data
        );
        return response.data.data;
    },

    /**
     * Update slot
     */
    async updateSlot(id: string, data: Partial<CreateSlotInput>): Promise<TimetableSlot> {
        const response = await apiClient.patch<ApiResponse<TimetableSlot>>(
            `/api/v1/timetable/slots/${id}`,
            data
        );
        return response.data.data;
    },

    /**
     * Delete slot
     */
    async deleteSlot(id: string): Promise<void> {
        await apiClient.delete(`/api/v1/timetable/slots/${id}`);
    },

    /**
     * Check for conflicts
     */
    async checkConflicts(data: CreateSlotInput): Promise<TimetableSlot[]> {
        const response = await apiClient.post<ApiResponse<TimetableSlot[]>>(
            '/api/v1/timetable/check-conflicts',
            data
        );
        return response.data.data;
    },
};
