/**
 * Reports Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse } from '../types/api-response';

// Types
export interface ReportCard {
    id: string;
    studentId: string;
    examId: string;
    totalMarks: number;
    percentage: number;
    grade: string;
    rank?: number;
    subjects: Array<{
        subjectId: string;
        name: string;
        marksObtained: number;
        maxMarks: number;
        grade: string;
    }>;
    remarks?: string;
    generatedAt: Date;
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

/**
 * Reports Client
 */
export const reportsClient = {
    /**
     * Generate report card
     */
    async generateReportCard(studentId: string, examId: string): Promise<ReportCard> {
        const response = await apiClient.post<ApiResponse<ReportCard>>(
            '/api/v1/reports/report-cards',
            { studentId, examId }
        );
        return response.data.data;
    },

    /**
     * Get report card
     */
    async getReportCard(studentId: string, examId: string): Promise<ReportCard> {
        const response = await apiClient.get<ApiResponse<ReportCard>>(
            `/api/v1/reports/report-cards/${studentId}/${examId}`
        );
        return response.data.data;
    },

    /**
     * Bulk generate report cards
     */
    async bulkGenerateReportCards(examId: string, classId: string): Promise<ReportCard[]> {
        const response = await apiClient.post<ApiResponse<ReportCard[]>>(
            '/api/v1/reports/report-cards/bulk',
            { examId, classId }
        );
        return response.data.data;
    },

    /**
     * Attendance report
     */
    async attendanceReport(params: {
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

    /**
     * Fee collection report
     */
    async feeReport(params?: { academicYearId?: string; classId?: string }): Promise<FeeReport> {
        const response = await apiClient.get<ApiResponse<FeeReport>>(
            '/api/v1/reports/fees',
            { params }
        );
        return response.data.data;
    },

    /**
     * Export report to PDF
     */
    async exportPdf(reportType: string, params: Record<string, string>): Promise<Blob> {
        const response = await apiClient.get(`/api/v1/reports/export/${reportType}`, {
            params,
            responseType: 'blob',
        });
        return response.data;
    },

    /**
     * Export report to Excel
     */
    async exportExcel(reportType: string, params: Record<string, string>): Promise<Blob> {
        const response = await apiClient.get(`/api/v1/reports/export/${reportType}/excel`, {
            params,
            responseType: 'blob',
        });
        return response.data;
    },
};
