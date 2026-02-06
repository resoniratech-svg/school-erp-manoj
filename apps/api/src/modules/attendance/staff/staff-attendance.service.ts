/**
 * Staff Attendance Service
 */
import {
    NotFoundError,
    ConflictError,
    BadRequestError,
} from '@school-erp/shared';
import { staffAttendanceRepository, StaffAttendanceRepository } from './staff-attendance.repository';
import { STAFF_ATTENDANCE_ERROR_CODES } from './staff-attendance.constants';
import type {
    StaffAttendanceResponse,
    StaffAttendanceContext,
} from './staff-attendance.types';
import type { MarkStaffAttendanceInput, UpdateStaffAttendanceInput } from './staff-attendance.validator';
import type { StaffAttendanceStatus } from './staff-attendance.constants';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

function toStaffAttendanceResponse(record: {
    id: string;
    staffId: string;
    date: Date;
    status: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    remarks: string | null;
    markedByUserId: string;
    createdAt: Date;
    updatedAt: Date;
    staff?: {
        id: string;
        firstName: string;
        lastName: string;
        employeeId: string | null;
    };
}): StaffAttendanceResponse {
    return {
        id: record.id,
        staffId: record.staffId,
        date: record.date.toISOString().split('T')[0],
        status: record.status as StaffAttendanceStatus,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        remarks: record.remarks,
        markedByUserId: record.markedByUserId,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        ...(record.staff && { staff: record.staff }),
    };
}

export class StaffAttendanceService {
    constructor(private readonly repository: StaffAttendanceRepository = staffAttendanceRepository) { }

    /**
     * Validate staff exists and is active in branch
     */
    private async validateStaff(staffId: string, tenantId: string, branchId: string) {
        const staff = await this.repository.findStaffById(staffId, tenantId);
        if (!staff) {
            throw new NotFoundError('Staff not found', {
                code: STAFF_ATTENDANCE_ERROR_CODES.STAFF_NOT_FOUND,
            });
        }
        if (staff.status !== 'active') {
            throw new BadRequestError('Staff is not active', {
                code: STAFF_ATTENDANCE_ERROR_CODES.STAFF_INACTIVE,
            });
        }
        if (staff.branchId !== branchId) {
            throw new BadRequestError('Staff does not belong to this branch', {
                code: STAFF_ATTENDANCE_ERROR_CODES.STAFF_WRONG_BRANCH,
            });
        }
        return staff;
    }

    /**
     * Mark staff attendance
     */
    async markAttendance(
        input: MarkStaffAttendanceInput,
        context: StaffAttendanceContext
    ): Promise<StaffAttendanceResponse> {
        const date = new Date(input.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Cannot mark future dates
        if (date > today) {
            throw new BadRequestError('Cannot mark attendance for future dates', {
                code: STAFF_ATTENDANCE_ERROR_CODES.FUTURE_DATE_NOT_ALLOWED,
            });
        }

        // Validate staff
        await this.validateStaff(input.staffId, context.tenantId, context.branchId);

        // Check for duplicate
        const existing = await this.repository.findByStaffDate(input.staffId, date);
        if (existing) {
            throw new ConflictError('Attendance already marked for this date', {
                code: STAFF_ATTENDANCE_ERROR_CODES.DUPLICATE_RECORD,
            });
        }

        const record = await this.repository.create({
            tenantId: context.tenantId,
            branchId: context.branchId,
            staffId: input.staffId,
            date,
            status: input.status,
            checkInTime: input.checkInTime,
            checkOutTime: input.checkOutTime,
            remarks: input.remarks,
            markedByUserId: context.userId,
        });

        logger.info('Staff attendance marked', {
            staffId: input.staffId,
            date: input.date,
            status: input.status,
            markedBy: context.userId,
        });

        return toStaffAttendanceResponse(record);
    }

    /**
     * Get attendance by ID
     */
    async getAttendanceById(id: string, context: StaffAttendanceContext): Promise<StaffAttendanceResponse> {
        const record = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!record) {
            throw new NotFoundError('Staff attendance record not found', {
                code: STAFF_ATTENDANCE_ERROR_CODES.NOT_FOUND,
            });
        }
        return toStaffAttendanceResponse(record);
    }

    /**
     * List staff attendance
     */
    async listAttendance(
        filters: { staffId?: string; date?: string },
        context: StaffAttendanceContext
    ): Promise<StaffAttendanceResponse[]> {
        const records = await this.repository.findMany(context.tenantId, context.branchId, {
            staffId: filters.staffId,
            date: filters.date ? new Date(filters.date) : undefined,
        });
        return records.map(toStaffAttendanceResponse);
    }

    /**
     * Update attendance
     */
    async updateAttendance(
        id: string,
        input: UpdateStaffAttendanceInput,
        context: StaffAttendanceContext
    ): Promise<StaffAttendanceResponse> {
        const existing = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!existing) {
            throw new NotFoundError('Staff attendance record not found', {
                code: STAFF_ATTENDANCE_ERROR_CODES.NOT_FOUND,
            });
        }

        const updated = await this.repository.update(id, {
            status: input.status,
            checkInTime: input.checkInTime,
            checkOutTime: input.checkOutTime,
            remarks: input.remarks,
            markedByUserId: context.userId,
        });

        logger.info('Staff attendance updated', {
            attendanceId: id,
            updatedBy: context.userId,
        });

        return toStaffAttendanceResponse(updated);
    }
}

export const staffAttendanceService = new StaffAttendanceService();
