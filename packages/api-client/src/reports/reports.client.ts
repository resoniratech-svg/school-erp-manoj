/**
 * Reports Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse, PaginatedResponse } from '../types/api-response';
import { buildQueryParams, type QueryParams } from '../types/pagination';

// Types
export interface ReportCard {
    id: string;
    studentId: string;
    examId: string;
    classId?: string;
    totalMarks: number;
    maxTotalMarks?: number;
    percentage: number;
    grade: string;
    rank?: number;
    status: 'draft' | 'published' | 'pending';
    student?: { id: string; name: string; rollNumber?: string };
    class?: { id: string; name: string };
    section?: { id: string; name: string };
    exam?: { id: string; name: string };
    subjects: Array<{
        subjectId: string;
        subjectName: string;
        marks: number;
        maxMarks: number;
        grade: string;
    }>;
    remarks?: string;
    generatedAt: string;
}

export interface AttendanceReport {
    startDate: string;
    endDate: string;
    totalWorkingDays: number;
    summary: Array<{
        studentId: string;
        studentName: string;
        present: number;
        absent: number;
        late: number;
        percentage: number;
    }>;
}

export interface FeeReport {
    totalCollected: number;
    totalPending: number;
    defaulters: Array<{
        studentId: string;
        studentName: string;
        pendingAmount: number;
        dueDate: string;
    }>;
}

export interface PromotionStatus {
    id: string;
    student: { id: string; name: string };
    currentClass: string;
    percentage: number;
    attendancePercentage: number;
    isEligible: boolean;
    status: 'promoted' | 'detained' | 'pending';
}

export interface Transcript {
    id: string;
    student: { id: string; name: string; rollNumber?: string; admissionYear?: string };
    currentClass: string;
    history: Array<{
        academicYear: string;
        class: string;
        percentage: number;
        grade: string;
        status: string;
    }>;
}

/**
 * Reports Client
 */
export const reportsClient = {
    /**
     * Report Cards
     */
    reportCards: {
        async list(params?: QueryParams): Promise<PaginatedResponse<ReportCard>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<ReportCard>>(
                `/api/v1/reports/report-cards${query}`
            );
            return response.data;
        },

        async get(id: string): Promise<ReportCard> {
            const response = await apiClient.get<ApiResponse<ReportCard>>(
                `/api/v1/reports/report-cards/${id}`
            );
            return response.data.data;
        },

        async generate(studentId: string, examId: string): Promise<ReportCard> {
            const response = await apiClient.post<ApiResponse<ReportCard>>(
                '/api/v1/reports/report-cards',
                { studentId, examId }
            );
            return response.data.data;
        },

        async bulkGenerate(examId: string, classId: string): Promise<ReportCard[]> {
            const response = await apiClient.post<ApiResponse<ReportCard[]>>(
                '/api/v1/reports/report-cards/bulk',
                { examId, classId }
            );
            return response.data.data;
        },
    },

    /**
     * Attendance
     */
    attendance: {
        async get(params: {
            classId?: string;
            startDate: string;
            endDate: string;
        }): Promise<AttendanceReport> {
            const response = await apiClient.get<ApiResponse<AttendanceReport>>(
                '/api/v1/reports/attendance',
                { params }
            );
            return response.data.data;
        },
    },

    /**
     * Fees
     */
    fees: {
        async get(params?: { academicYearId?: string; classId?: string }): Promise<FeeReport> {
            const response = await apiClient.get<ApiResponse<FeeReport>>(
                '/api/v1/reports/fees',
                { params }
            );
            return response.data.data;
        },
    },

    /**
     * Promotion
     */
    promotion: {
        async list(params?: QueryParams & { classId?: string }): Promise<PaginatedResponse<PromotionStatus>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<PromotionStatus>>(
                `/api/v1/reports/promotion${query}`
            );
            return response.data;
        },
    },

    /**
     * Transcripts
     */
    transcripts: {
        async get(studentId: string): Promise<Transcript> {
            const response = await apiClient.get<ApiResponse<Transcript>>(
                `/api/v1/reports/transcripts/${studentId}`
            );
            return response.data.data;
        },
    },

    /**
     * Legacy methods (deprecated)
     */
    async generateReportCard(studentId: string, examId: string): Promise<ReportCard> {
        return this.reportCards.generate(studentId, examId);
    },

    async getReportCard(studentId: string, examId: string): Promise<ReportCard> {
        const response = await apiClient.get<ApiResponse<ReportCard>>(
            `/api/v1/reports/report-cards/${studentId}/${examId}`
        );
        return response.data.data;
    },

    async attendanceReport(params: {
        classId?: string;
        startDate: string;
        endDate: string;
    }): Promise<AttendanceReport> {
        return this.attendance.get(params);
    },

    async feeReport(params?: { academicYearId?: string; classId?: string }): Promise<FeeReport> {
        return this.fees.get(params);
    },

    /**
     * Exports
     */
    async exportPdf(reportType: string, params: Record<string, string>): Promise<Blob> {
        const response = await apiClient.get(`/api/v1/reports/export/${reportType}`, {
            params,
            responseType: 'blob',
        });
        return response.data;
    },

    async exportExcel(reportType: string, params: Record<string, string>): Promise<Blob> {
        const response = await apiClient.get(`/api/v1/reports/export/${reportType}/excel`, {
            params,
            responseType: 'blob',
        });
        return response.data;
    },
};
