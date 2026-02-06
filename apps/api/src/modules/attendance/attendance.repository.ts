/**
 * Attendance Repository
 * Prisma database access layer with branch isolation
 */
import { db } from '@school-erp/database';
import type { AttendanceStatus } from './attendance.constants';

const attendanceSelectFields = {
    id: true,
    tenantId: true,
    branchId: true,
    studentId: true,
    sectionId: true,
    academicYearId: true,
    date: true,
    status: true,
    remarks: true,
    markedByUserId: true,
    createdAt: true,
    updatedAt: true,
} as const;

const attendanceWithStudentSelect = {
    ...attendanceSelectFields,
    student: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
        },
    },
} as const;

export class AttendanceRepository {
    /**
     * Find attendance by ID with branch isolation
     */
    async findById(id: string, tenantId: string, branchId: string) {
        return db.attendanceRecord.findFirst({
            where: {
                id,
                tenantId,
                branchId,
            },
            select: attendanceWithStudentSelect,
        });
    }

    /**
     * Find attendance by section and date
     */
    async findBySectionDate(
        tenantId: string,
        branchId: string,
        sectionId: string,
        date: Date
    ) {
        return db.attendanceRecord.findMany({
            where: {
                tenantId,
                branchId,
                sectionId,
                date,
            },
            select: attendanceWithStudentSelect,
            orderBy: { student: { rollNumber: 'asc' } },
        });
    }

    /**
     * Find existing attendance for student on date
     */
    async findByStudentDate(studentId: string, date: Date) {
        return db.attendanceRecord.findFirst({
            where: {
                studentId,
                date,
            },
            select: attendanceSelectFields,
        });
    }

    /**
     * Find attendance records with filters
     */
    async findMany(
        tenantId: string,
        branchId: string,
        filters?: {
            sectionId?: string;
            date?: Date;
            studentId?: string;
            academicYearId?: string;
        }
    ) {
        return db.attendanceRecord.findMany({
            where: {
                tenantId,
                branchId,
                ...(filters?.sectionId && { sectionId: filters.sectionId }),
                ...(filters?.date && { date: filters.date }),
                ...(filters?.studentId && { studentId: filters.studentId }),
                ...(filters?.academicYearId && { academicYearId: filters.academicYearId }),
            },
            select: attendanceWithStudentSelect,
            orderBy: { date: 'desc' },
        });
    }

    /**
     * Get student attendance for summary calculation
     */
    async findByStudentForSummary(
        studentId: string,
        tenantId: string,
        academicYearId?: string
    ) {
        return db.attendanceRecord.findMany({
            where: {
                studentId,
                tenantId,
                ...(academicYearId && { academicYearId }),
            },
            select: {
                status: true,
                date: true,
            },
        });
    }

    /**
     * Bulk create attendance records (transaction)
     */
    async bulkCreate(records: Array<{
        tenantId: string;
        branchId: string;
        studentId: string;
        sectionId: string;
        academicYearId: string;
        date: Date;
        status: string;
        remarks?: string;
        markedByUserId: string;
    }>) {
        return db.$transaction(
            records.map((record) =>
                db.attendanceRecord.create({
                    data: {
                        tenantId: record.tenantId,
                        branchId: record.branchId,
                        studentId: record.studentId,
                        sectionId: record.sectionId,
                        academicYearId: record.academicYearId,
                        date: record.date,
                        status: record.status,
                        remarks: record.remarks,
                        markedByUserId: record.markedByUserId,
                    },
                    select: attendanceSelectFields,
                })
            )
        );
    }

    /**
     * Bulk upsert attendance records (for corrections)
     */
    async bulkUpsert(records: Array<{
        tenantId: string;
        branchId: string;
        studentId: string;
        sectionId: string;
        academicYearId: string;
        date: Date;
        status: string;
        remarks?: string;
        markedByUserId: string;
    }>) {
        return db.$transaction(
            records.map((record) =>
                db.attendanceRecord.upsert({
                    where: {
                        studentId_date: {
                            studentId: record.studentId,
                            date: record.date,
                        },
                    },
                    create: {
                        tenantId: record.tenantId,
                        branchId: record.branchId,
                        studentId: record.studentId,
                        sectionId: record.sectionId,
                        academicYearId: record.academicYearId,
                        date: record.date,
                        status: record.status,
                        remarks: record.remarks,
                        markedByUserId: record.markedByUserId,
                    },
                    update: {
                        status: record.status,
                        remarks: record.remarks,
                        markedByUserId: record.markedByUserId,
                    },
                    select: attendanceSelectFields,
                })
            )
        );
    }

    /**
     * Update attendance record
     */
    async update(id: string, data: {
        status?: string;
        remarks?: string | null;
        markedByUserId: string;
    }) {
        return db.attendanceRecord.update({
            where: { id },
            data: {
                status: data.status,
                remarks: data.remarks,
                markedByUserId: data.markedByUserId,
            },
            select: attendanceWithStudentSelect,
        });
    }

    // Validation helpers
    async findStudentById(studentId: string, tenantId: string) {
        return db.student.findFirst({
            where: { id: studentId, tenantId, deletedAt: null },
            select: { id: true, status: true },
        });
    }

    async findStudentEnrollment(studentId: string, sectionId: string, academicYearId: string) {
        return db.studentEnrollment.findFirst({
            where: {
                studentId,
                sectionId,
                academicYearId,
                status: 'active',
            },
            select: { id: true },
        });
    }

    async findSectionById(sectionId: string, tenantId: string, branchId: string) {
        return db.section.findFirst({
            where: { id: sectionId, tenantId, deletedAt: null },
            select: {
                id: true,
                class: {
                    select: { branchId: true },
                },
            },
        });
    }

    async findAcademicYearById(academicYearId: string, tenantId: string) {
        return db.academicYear.findFirst({
            where: { id: academicYearId, tenantId },
            select: { id: true, startDate: true, endDate: true },
        });
    }
}

export const attendanceRepository = new AttendanceRepository();
