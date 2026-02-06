/**
 * Attendance Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse, PaginatedResponse } from '../types/api-response';
import { buildQueryParams, type QueryParams } from '../types/pagination';

// Types
export interface AttendanceRecord {
    id: string;
    studentId: string;
    classId: string;
    sectionId: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    markedBy: string;
    markedAt: Date;
}

export interface BulkMarkInput {
    classId: string;
    sectionId: string;
    date: string;
    records: Array<{
        studentId: string;
        status: 'present' | 'absent' | 'late' | 'excused';
    }>;
}

export interface AttendanceSummary {
    studentId: string;
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
}

/**
 * Attendance Client
 */
export const attendanceClient = {
    /**
     * Mark attendance for single student
     */
    async mark(data: {
        studentId: string;
        classId: string;
        sectionId: string;
        date: string;
        status: 'present' | 'absent' | 'late' | 'excused';
    }): Promise<AttendanceRecord> {
        const response = await apiClient.post<ApiResponse<AttendanceRecord>>(
            '/api/v1/attendance',
            data
        );
        return response.data.data;
    },

    /**
     * Bulk mark attendance
     */
    async bulkMark(data: BulkMarkInput): Promise<AttendanceRecord[]> {
        const response = await apiClient.post<ApiResponse<AttendanceRecord[]>>(
            '/api/v1/attendance/bulk',
            data
        );
        return response.data.data;
    },

    /**
     * Get attendance by date and class
     */
    async getByDate(params: {
        classId: string;
        sectionId: string;
        date: string;
    }): Promise<AttendanceRecord[]> {
        const query = buildQueryParams(params as QueryParams);
        const response = await apiClient.get<ApiResponse<AttendanceRecord[]>>(
            `/api/v1/attendance${query}`
        );
        return response.data.data;
    },

    /**
     * Get student attendance history
     */
    async getStudentHistory(
        studentId: string,
        params?: { startDate?: string; endDate?: string }
    ): Promise<PaginatedResponse<AttendanceRecord>> {
        const query = buildQueryParams(params || {});
        const response = await apiClient.get<PaginatedResponse<AttendanceRecord>>(
            `/api/v1/attendance/student/${studentId}${query}`
        );
        return response.data;
    },

    /**
     * Get attendance summary
     */
    async getSummary(params: {
        classId?: string;
        sectionId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<AttendanceSummary[]> {
        const query = buildQueryParams(params as QueryParams);
        const response = await apiClient.get<ApiResponse<AttendanceSummary[]>>(
            `/api/v1/attendance/summary${query}`
        );
        return response.data.data;
    },

    /**
     * Update attendance record
     */
    async update(
        id: string,
        data: { status: 'present' | 'absent' | 'late' | 'excused' }
    ): Promise<AttendanceRecord> {
        const response = await apiClient.patch<ApiResponse<AttendanceRecord>>(
            `/api/v1/attendance/${id}`,
            data
        );
        return response.data.data;
    },
};
