/**
 * Staff Attendance Types
 */
import type { StaffAttendanceStatus } from './staff-attendance.constants';

export interface StaffAttendanceResponse {
    id: string;
    staffId: string;
    date: string;
    status: StaffAttendanceStatus;
    checkInTime: string | null;
    checkOutTime: string | null;
    remarks: string | null;
    markedByUserId: string;
    createdAt: string;
    updatedAt: string;
    staff?: {
        id: string;
        firstName: string;
        lastName: string;
        employeeId: string | null;
    };
}

export interface MarkStaffAttendanceInput {
    staffId: string;
    date: string;
    status: StaffAttendanceStatus;
    checkInTime?: string;
    checkOutTime?: string;
    remarks?: string;
}

export interface UpdateStaffAttendanceInput {
    status?: StaffAttendanceStatus;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    remarks?: string | null;
}

export interface StaffAttendanceContext {
    tenantId: string;
    branchId: string;
    userId: string;
}
