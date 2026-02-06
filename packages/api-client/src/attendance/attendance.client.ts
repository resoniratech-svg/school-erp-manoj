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
    status: 'present' | 'absent' | 'late' | 'excused' | 'half_day';
    markedBy: string;
    markedAt: Date;
    createdAt: string;
    student?: {
        name: string;
    };
    class?: {
        name: string;
    };
    section?: {
        name: string;
    };
}

export interface BulkMarkInput {
    classId: string;
    sectionId: string;
    date: string;
    records: Array<{
        studentId: string;
        status: 'present' | 'absent' | 'late' | 'excused' | 'half_day';
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

export interface StaffAttendanceRecord {
    id: string;
    staffId: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'leave';
    checkInTime?: string;
    checkOutTime?: string;
    staff?: {
        name: string;
        department: string;
    };
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
        status: 'present' | 'absent' | 'late' | 'excused' | 'half_day';
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
    async markBulk(data: BulkMarkInput): Promise<AttendanceRecord[]> {
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
     * List attendance records with pagination
     */
    async list(params?: QueryParams & { date?: string }): Promise<PaginatedResponse<AttendanceRecord>> {
        const query = buildQueryParams(params as QueryParams);
        const response = await apiClient.get<PaginatedResponse<AttendanceRecord>>(
            `/api/v1/attendance${query}`
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
        data: { status: 'present' | 'absent' | 'late' | 'excused' | 'half_day' }
    ): Promise<AttendanceRecord> {
        const response = await apiClient.patch<ApiResponse<AttendanceRecord>>(
            `/api/v1/attendance/${id}`,
            data
        );
        return response.data.data;
    },

    /**
     * Staff attendance methods
     */
    staff: {
        /**
         * Get staff for marking attendance
         */
        async getForMarking(params: { date: string }): Promise<{ staff: any[] }> {
            const query = buildQueryParams(params as QueryParams);
            const response = await apiClient.get<ApiResponse<{ staff: any[] }>>(
                `/api/v1/attendance/staff/marking${query}`
            );
            return response.data.data;
        },

        /**
         * Bulk mark staff attendance
         */
        async markBulk(data: {
            date: string;
            records: Array<{
                staffId: string;
                status: 'present' | 'absent' | 'late' | 'leave';
                checkInTime?: string;
            }>;
        }): Promise<void> {
            await apiClient.post<ApiResponse<void>>(
                '/api/v1/attendance/staff/bulk',
                data
            );
        },

        /**
         * List staff attendance records
         */
        async list(params?: QueryParams & { date?: string }): Promise<PaginatedResponse<StaffAttendanceRecord>> {
            const query = buildQueryParams(params as QueryParams);
            const response = await apiClient.get<PaginatedResponse<StaffAttendanceRecord>>(
                `/api/v1/attendance/staff${query}`
            );
            return response.data;
        },
    },

    /**
     * Get students for marking attendance
     */
    async getStudentsForMarking(params: {
        classId: string;
        sectionId: string;
        date: string;
    }): Promise<{ students: any[] }> {
        const query = buildQueryParams(params as QueryParams);
        const response = await apiClient.get<ApiResponse<{ students: any[] }>>(
            `/api/v1/attendance/students/marking${query}`
        );
        return response.data.data;
    },

    /**
     * Get attendance record by ID
     */
    async get(id: string): Promise<AttendanceRecord> {
        const response = await apiClient.get<ApiResponse<AttendanceRecord>>(
            `/api/v1/attendance/${id}`
        );
        return response.data.data;
    },
};
