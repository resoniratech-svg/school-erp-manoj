/**
 * Staff Attendance Repository
 */
import { db } from '@school-erp/database';

const staffAttendanceSelectFields = {
    id: true,
    tenantId: true,
    branchId: true,
    staffId: true,
    date: true,
    status: true,
    checkInTime: true,
    checkOutTime: true,
    remarks: true,
    markedByUserId: true,
    createdAt: true,
    updatedAt: true,
} as const;

const staffAttendanceWithStaffSelect = {
    ...staffAttendanceSelectFields,
    staff: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
        },
    },
} as const;

export class StaffAttendanceRepository {
    /**
     * Find by ID with branch isolation
     */
    async findById(id: string, tenantId: string, branchId: string) {
        return db.staffAttendanceRecord.findFirst({
            where: {
                id,
                tenantId,
                branchId,
            },
            select: staffAttendanceWithStaffSelect,
        });
    }

    /**
     * Find by staff and date
     */
    async findByStaffDate(staffId: string, date: Date) {
        return db.staffAttendanceRecord.findFirst({
            where: {
                staffId,
                date,
            },
            select: staffAttendanceSelectFields,
        });
    }

    /**
     * Find many with filters
     */
    async findMany(
        tenantId: string,
        branchId: string,
        filters?: { staffId?: string; date?: Date }
    ) {
        return db.staffAttendanceRecord.findMany({
            where: {
                tenantId,
                branchId,
                ...(filters?.staffId && { staffId: filters.staffId }),
                ...(filters?.date && { date: filters.date }),
            },
            select: staffAttendanceWithStaffSelect,
            orderBy: { date: 'desc' },
        });
    }

    /**
     * Create attendance
     */
    async create(data: {
        tenantId: string;
        branchId: string;
        staffId: string;
        date: Date;
        status: string;
        checkInTime?: string;
        checkOutTime?: string;
        remarks?: string;
        markedByUserId: string;
    }) {
        return db.staffAttendanceRecord.create({
            data: {
                tenantId: data.tenantId,
                branchId: data.branchId,
                staffId: data.staffId,
                date: data.date,
                status: data.status,
                checkInTime: data.checkInTime,
                checkOutTime: data.checkOutTime,
                remarks: data.remarks,
                markedByUserId: data.markedByUserId,
            },
            select: staffAttendanceWithStaffSelect,
        });
    }

    /**
     * Update attendance
     */
    async update(id: string, data: {
        status?: string;
        checkInTime?: string | null;
        checkOutTime?: string | null;
        remarks?: string | null;
        markedByUserId: string;
    }) {
        return db.staffAttendanceRecord.update({
            where: { id },
            data: {
                status: data.status,
                checkInTime: data.checkInTime,
                checkOutTime: data.checkOutTime,
                remarks: data.remarks,
                markedByUserId: data.markedByUserId,
            },
            select: staffAttendanceWithStaffSelect,
        });
    }

    // Validation helper
    async findStaffById(staffId: string, tenantId: string) {
        return db.staff.findFirst({
            where: { id: staffId, tenantId, deletedAt: null },
            select: { id: true, branchId: true, status: true },
        });
    }
}

export const staffAttendanceRepository = new StaffAttendanceRepository();
