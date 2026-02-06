/**
 * Attendance Service
 * Business logic layer with bulk marking and summaries
 */
import {
    NotFoundError,
    ConflictError,
    BadRequestError,
} from '@school-erp/shared';
import { attendanceRepository, AttendanceRepository } from './attendance.repository';
import { toAttendanceResponse, toAttendanceResponseList } from './attendance.mapper';
import { ATTENDANCE_ERROR_CODES, ATTENDANCE_STATUS } from './attendance.constants';
import type {
    AttendanceRecordResponse,
    AttendanceSummary,
    AttendanceContext,
    BulkAttendanceEntry,
} from './attendance.types';
import type { BulkMarkAttendanceInput, UpdateAttendanceInput } from './attendance.validator';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

export class AttendanceService {
    constructor(private readonly repository: AttendanceRepository = attendanceRepository) { }

    /**
     * Validate academic year and date range
     */
    private async validateAcademicYear(
        academicYearId: string,
        date: Date,
        tenantId: string
    ) {
        const academicYear = await this.repository.findAcademicYearById(academicYearId, tenantId);
        if (!academicYear) {
            throw new NotFoundError('Academic year not found', {
                code: ATTENDANCE_ERROR_CODES.ACADEMIC_YEAR_NOT_FOUND,
            });
        }

        if (date < academicYear.startDate || date > academicYear.endDate) {
            throw new BadRequestError('Date is outside academic year range', {
                code: ATTENDANCE_ERROR_CODES.DATE_OUTSIDE_ACADEMIC_YEAR,
            });
        }

        return academicYear;
    }

    /**
     * Validate section belongs to branch
     */
    private async validateSection(
        sectionId: string,
        tenantId: string,
        branchId: string
    ) {
        const section = await this.repository.findSectionById(sectionId, tenantId, branchId);
        if (!section) {
            throw new NotFoundError('Section not found', {
                code: ATTENDANCE_ERROR_CODES.SECTION_NOT_FOUND,
            });
        }
        if (section.class.branchId !== branchId) {
            throw new BadRequestError('Section does not belong to this branch', {
                code: ATTENDANCE_ERROR_CODES.SECTION_NOT_FOUND,
            });
        }
        return section;
    }

    /**
     * Validate student and enrollment
     */
    private async validateStudent(
        studentId: string,
        sectionId: string,
        academicYearId: string,
        tenantId: string
    ) {
        const student = await this.repository.findStudentById(studentId, tenantId);
        if (!student) {
            throw new NotFoundError('Student not found', {
                code: ATTENDANCE_ERROR_CODES.STUDENT_NOT_FOUND,
            });
        }
        if (student.status !== 'active') {
            throw new BadRequestError('Student is not active', {
                code: ATTENDANCE_ERROR_CODES.STUDENT_INACTIVE,
            });
        }

        const enrollment = await this.repository.findStudentEnrollment(
            studentId,
            sectionId,
            academicYearId
        );
        if (!enrollment) {
            throw new BadRequestError('Student is not enrolled in this section', {
                code: ATTENDANCE_ERROR_CODES.STUDENT_NOT_ENROLLED,
            });
        }

        return student;
    }

    /**
     * Bulk mark attendance for a section
     */
    async bulkMarkAttendance(
        input: BulkMarkAttendanceInput,
        context: AttendanceContext
    ): Promise<AttendanceRecordResponse[]> {
        const date = new Date(input.date);

        // Validate academic year and date
        await this.validateAcademicYear(input.academicYearId, date, context.tenantId);

        // Validate section
        await this.validateSection(input.sectionId, context.tenantId, context.branchId);

        // Check for existing records
        const existingRecordsMap = new Map<string, boolean>();
        for (const entry of input.entries) {
            const existing = await this.repository.findByStudentDate(entry.studentId, date);
            if (existing) {
                existingRecordsMap.set(entry.studentId, true);
            }
        }

        // If corrections not allowed, reject duplicates
        if (!input.allowCorrection) {
            const duplicates = input.entries.filter(e => existingRecordsMap.has(e.studentId));
            if (duplicates.length > 0) {
                throw new ConflictError(
                    `Attendance already exists for ${duplicates.length} student(s). Enable allowCorrection to update.`,
                    { code: ATTENDANCE_ERROR_CODES.DUPLICATE_RECORD }
                );
            }
        }

        // Validate all students
        for (const entry of input.entries) {
            await this.validateStudent(
                entry.studentId,
                input.sectionId,
                input.academicYearId,
                context.tenantId
            );
        }

        // Prepare records
        const records = input.entries.map((entry: BulkAttendanceEntry) => ({
            tenantId: context.tenantId,
            branchId: context.branchId,
            studentId: entry.studentId,
            sectionId: input.sectionId,
            academicYearId: input.academicYearId,
            date,
            status: entry.status,
            remarks: entry.remarks,
            markedByUserId: context.userId,
        }));

        // Use upsert if corrections allowed, otherwise create
        const results = input.allowCorrection
            ? await this.repository.bulkUpsert(records)
            : await this.repository.bulkCreate(records);

        logger.info('Bulk attendance marked', {
            sectionId: input.sectionId,
            date: input.date,
            count: results.length,
            correction: input.allowCorrection,
            markedBy: context.userId,
        });

        return results.map(toAttendanceResponse);
    }

    /**
     * Get attendance by section and date
     */
    async getAttendanceBySectionDate(
        sectionId: string,
        date: string,
        context: AttendanceContext
    ): Promise<AttendanceRecordResponse[]> {
        await this.validateSection(sectionId, context.tenantId, context.branchId);

        const records = await this.repository.findBySectionDate(
            context.tenantId,
            context.branchId,
            sectionId,
            new Date(date)
        );

        return toAttendanceResponseList(records);
    }

    /**
     * Get attendance by ID
     */
    async getAttendanceById(id: string, context: AttendanceContext): Promise<AttendanceRecordResponse> {
        const record = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!record) {
            throw new NotFoundError('Attendance record not found', {
                code: ATTENDANCE_ERROR_CODES.NOT_FOUND,
            });
        }
        return toAttendanceResponse(record);
    }

    /**
     * List attendance with filters
     */
    async listAttendance(
        filters: { sectionId?: string; date?: string; studentId?: string; academicYearId?: string },
        context: AttendanceContext
    ): Promise<AttendanceRecordResponse[]> {
        const records = await this.repository.findMany(context.tenantId, context.branchId, {
            sectionId: filters.sectionId,
            date: filters.date ? new Date(filters.date) : undefined,
            studentId: filters.studentId,
            academicYearId: filters.academicYearId,
        });
        return toAttendanceResponseList(records);
    }

    /**
     * Update attendance (correction)
     */
    async updateAttendance(
        id: string,
        input: UpdateAttendanceInput,
        context: AttendanceContext
    ): Promise<AttendanceRecordResponse> {
        const existing = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!existing) {
            throw new NotFoundError('Attendance record not found', {
                code: ATTENDANCE_ERROR_CODES.NOT_FOUND,
            });
        }

        // Log audit info
        logger.info('Attendance correction', {
            attendanceId: id,
            previousStatus: existing.status,
            newStatus: input.status || existing.status,
            correctedBy: context.userId,
        });

        const updated = await this.repository.update(id, {
            status: input.status,
            remarks: input.remarks,
            markedByUserId: context.userId,
        });

        return toAttendanceResponse(updated);
    }

    /**
     * Get student attendance summary
     */
    async getStudentSummary(
        studentId: string,
        academicYearId: string | undefined,
        context: AttendanceContext
    ): Promise<AttendanceSummary> {
        // Verify student exists
        const student = await this.repository.findStudentById(studentId, context.tenantId);
        if (!student) {
            throw new NotFoundError('Student not found', {
                code: ATTENDANCE_ERROR_CODES.STUDENT_NOT_FOUND,
            });
        }

        const records = await this.repository.findByStudentForSummary(
            studentId,
            context.tenantId,
            academicYearId
        );

        const summary: AttendanceSummary = {
            studentId,
            totalDays: records.length,
            presentDays: 0,
            absentDays: 0,
            lateDays: 0,
            halfDays: 0,
            excusedDays: 0,
            percentage: 0,
        };

        for (const record of records) {
            switch (record.status) {
                case ATTENDANCE_STATUS.PRESENT:
                    summary.presentDays++;
                    break;
                case ATTENDANCE_STATUS.ABSENT:
                    summary.absentDays++;
                    break;
                case ATTENDANCE_STATUS.LATE:
                    summary.lateDays++;
                    break;
                case ATTENDANCE_STATUS.HALF_DAY:
                    summary.halfDays++;
                    break;
                case ATTENDANCE_STATUS.EXCUSED:
                    summary.excusedDays++;
                    break;
            }
        }

        if (summary.totalDays > 0) {
            // Consider present + late + half_day (0.5) as attendance
            const effectivePresent = summary.presentDays + summary.lateDays + (summary.halfDays * 0.5);
            summary.percentage = Math.round((effectivePresent / summary.totalDays) * 100 * 100) / 100;
        }

        return summary;
    }
}

export const attendanceService = new AttendanceService();
