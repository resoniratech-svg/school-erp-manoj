/**
 * Attendance Types
 */
import type { AttendanceStatus } from './attendance.constants';

export interface AttendanceRecordResponse {
    id: string;
    studentId: string;
    sectionId: string;
    academicYearId: string;
    date: string;
    status: AttendanceStatus;
    remarks: string | null;
    markedByUserId: string;
    createdAt: string;
    updatedAt: string;
    student?: {
        id: string;
        firstName: string;
        lastName: string;
        rollNumber: string | null;
    };
}

export interface BulkAttendanceEntry {
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
}

export interface BulkMarkAttendanceInput {
    sectionId: string;
    academicYearId: string;
    date: string;
    entries: BulkAttendanceEntry[];
    allowCorrection?: boolean;
}

export interface UpdateAttendanceInput {
    status?: AttendanceStatus;
    remarks?: string | null;
}

export interface AttendanceSummary {
    studentId: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    excusedDays: number;
    percentage: number;
}

export interface AttendanceContext {
    tenantId: string;
    branchId: string;
    userId: string;
}

export interface AttendanceAuditEntry {
    attendanceId: string;
    previousStatus: AttendanceStatus;
    newStatus: AttendanceStatus;
    changedByUserId: string;
    changedAt: Date;
}
