/**
 * Marks Service
 */
import {
    NotFoundError,
    ConflictError,
    BadRequestError,
} from '@school-erp/shared';
import { marksRepository, MarksRepository } from './marks.repository';
import { MARKS_ERROR_CODES } from './marks.constants';
import { EXAM_STATUS } from '../exams.constants';
import { gradesService } from '../grades';
import type {
    MarksEntryResponse,
    MarksContext,
    StudentResult,
    BulkMarksEntry,
} from './marks.types';
import type { BulkEnterMarksInput, UpdateMarksInput } from './marks.validator';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

function toMarksResponse(marks: {
    id: string;
    examScheduleId: string;
    studentId: string;
    marksObtained: number;
    isAbsent: boolean;
    remarks: string | null;
    grade: string | null;
    percentage: number | null;
    createdAt: Date;
    updatedAt: Date;
    student?: {
        id: string;
        firstName: string;
        lastName: string;
        rollNumber: string | null;
    };
}): MarksEntryResponse {
    return {
        id: marks.id,
        examScheduleId: marks.examScheduleId,
        studentId: marks.studentId,
        marksObtained: marks.marksObtained,
        isAbsent: marks.isAbsent,
        remarks: marks.remarks,
        grade: marks.grade,
        percentage: marks.percentage,
        createdAt: marks.createdAt.toISOString(),
        updatedAt: marks.updatedAt.toISOString(),
        student: marks.student,
    };
}

export class MarksService {
    constructor(private readonly repository: MarksRepository = marksRepository) { }

    /**
     * Bulk enter marks
     */
    async bulkEnterMarks(
        input: BulkEnterMarksInput,
        context: MarksContext
    ): Promise<MarksEntryResponse[]> {
        // Validate schedule
        const schedule = await this.repository.findScheduleById(input.examScheduleId);
        if (!schedule) {
            throw new NotFoundError('Exam schedule not found', {
                code: MARKS_ERROR_CODES.SCHEDULE_NOT_FOUND,
            });
        }

        // Validate exam is not published
        if (schedule.exam.status === EXAM_STATUS.PUBLISHED) {
            throw new BadRequestError('Cannot enter marks for published exam', {
                code: MARKS_ERROR_CODES.EXAM_PUBLISHED,
            });
        }

        // Validate exam tenant/branch
        if (schedule.exam.tenantId !== context.tenantId || schedule.exam.branchId !== context.branchId) {
            throw new NotFoundError('Exam schedule not found', {
                code: MARKS_ERROR_CODES.SCHEDULE_NOT_FOUND,
            });
        }

        // Cannot enter marks before exam date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (schedule.date > today) {
            throw new BadRequestError('Cannot enter marks before exam date', {
                code: MARKS_ERROR_CODES.BEFORE_EXAM_DATE,
            });
        }

        // Validate all entries
        const preparedEntries: Array<{
            examScheduleId: string;
            studentId: string;
            marksObtained: number;
            isAbsent: boolean;
            remarks?: string;
            grade: string;
            percentage: number;
            enteredByUserId: string;
        }> = [];

        for (const entry of input.entries) {
            // Check for duplicate
            const existing = await this.repository.findByStudentSchedule(
                entry.studentId,
                input.examScheduleId
            );
            if (existing) {
                throw new ConflictError(`Marks already entered for student ${entry.studentId}`, {
                    code: MARKS_ERROR_CODES.DUPLICATE_ENTRY,
                });
            }

            // Validate student
            const student = await this.repository.findStudentById(entry.studentId, context.tenantId);
            if (!student) {
                throw new NotFoundError(`Student not found: ${entry.studentId}`, {
                    code: MARKS_ERROR_CODES.STUDENT_NOT_FOUND,
                });
            }

            // Validate enrollment
            const enrollment = await this.repository.findStudentEnrollment(
                entry.studentId,
                schedule.classId
            );
            if (!enrollment) {
                throw new BadRequestError(`Student not enrolled in class: ${entry.studentId}`, {
                    code: MARKS_ERROR_CODES.STUDENT_NOT_ENROLLED,
                });
            }

            // Validate marks don't exceed max
            if (entry.marksObtained > schedule.maxMarks) {
                throw new BadRequestError(
                    `Marks ${entry.marksObtained} exceed max marks ${schedule.maxMarks}`,
                    { code: MARKS_ERROR_CODES.MARKS_EXCEED_MAX }
                );
            }

            // Calculate percentage and grade
            const percentage = (entry.marksObtained / schedule.maxMarks) * 100;
            const grade = gradesService.calculateGrade(percentage);

            preparedEntries.push({
                examScheduleId: input.examScheduleId,
                studentId: entry.studentId,
                marksObtained: entry.marksObtained,
                isAbsent: entry.isAbsent || false,
                remarks: entry.remarks,
                grade,
                percentage: Math.round(percentage * 100) / 100,
                enteredByUserId: context.userId,
            });
        }

        const results = await this.repository.bulkCreate(preparedEntries);

        logger.info('Bulk marks entered', {
            examScheduleId: input.examScheduleId,
            count: results.length,
            enteredBy: context.userId,
        });

        return results.map(toMarksResponse);
    }

    /**
     * Get marks by schedule
     */
    async getMarksBySchedule(examScheduleId: string): Promise<MarksEntryResponse[]> {
        const marks = await this.repository.findBySchedule(examScheduleId);
        return marks.map(toMarksResponse);
    }

    /**
     * Get marks by ID
     */
    async getMarksById(id: string): Promise<MarksEntryResponse> {
        const marks = await this.repository.findById(id);
        if (!marks) {
            throw new NotFoundError('Marks not found', {
                code: MARKS_ERROR_CODES.NOT_FOUND,
            });
        }
        return toMarksResponse(marks);
    }

    /**
     * Update marks
     */
    async updateMarks(
        id: string,
        input: UpdateMarksInput,
        context: MarksContext
    ): Promise<MarksEntryResponse> {
        const marks = await this.repository.findById(id);
        if (!marks) {
            throw new NotFoundError('Marks not found', {
                code: MARKS_ERROR_CODES.NOT_FOUND,
            });
        }

        // Get schedule to check exam status
        const schedule = await this.repository.findScheduleById(marks.examScheduleId);
        if (schedule?.exam.status === EXAM_STATUS.PUBLISHED) {
            throw new BadRequestError('Cannot modify marks for published exam', {
                code: MARKS_ERROR_CODES.EXAM_PUBLISHED,
            });
        }

        let newGrade = marks.grade;
        let newPercentage = marks.percentage;

        if (input.marksObtained !== undefined && schedule) {
            if (input.marksObtained > schedule.maxMarks) {
                throw new BadRequestError(
                    `Marks ${input.marksObtained} exceed max marks ${schedule.maxMarks}`,
                    { code: MARKS_ERROR_CODES.MARKS_EXCEED_MAX }
                );
            }
            newPercentage = (input.marksObtained / schedule.maxMarks) * 100;
            newGrade = gradesService.calculateGrade(newPercentage);
            newPercentage = Math.round(newPercentage * 100) / 100;
        }

        const updated = await this.repository.update(id, {
            marksObtained: input.marksObtained,
            isAbsent: input.isAbsent,
            remarks: input.remarks,
            grade: newGrade || undefined,
            percentage: newPercentage || undefined,
            enteredByUserId: context.userId,
        });

        logger.info('Marks updated', { marksId: id, updatedBy: context.userId });

        return toMarksResponse(updated);
    }

    /**
     * Get student results for an exam
     */
    async getStudentResults(
        examId: string,
        studentId: string,
        context: MarksContext
    ): Promise<StudentResult> {
        const student = await this.repository.findStudentById(studentId, context.tenantId);
        if (!student) {
            throw new NotFoundError('Student not found', {
                code: MARKS_ERROR_CODES.STUDENT_NOT_FOUND,
            });
        }

        const marksEntries = await this.repository.findByStudentExam(studentId, examId);

        const subjects = marksEntries.map((entry) => ({
            subjectId: entry.examSchedule.subjectId,
            subjectName: entry.examSchedule.subject.name,
            maxMarks: entry.examSchedule.maxMarks,
            marksObtained: entry.marksObtained,
            percentage: entry.percentage || 0,
            grade: entry.grade || 'N/A',
            isAbsent: entry.isAbsent,
        }));

        const totalMarks = subjects.reduce((sum, s) => sum + (s.isAbsent ? 0 : s.marksObtained), 0);
        const totalMaxMarks = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
        const overallPercentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
        const overallGrade = gradesService.calculateGrade(overallPercentage);

        return {
            studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            subjects,
            totalMarks,
            totalMaxMarks,
            overallPercentage: Math.round(overallPercentage * 100) / 100,
            overallGrade,
        };
    }
}

export const marksService = new MarksService();
