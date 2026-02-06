/**
 * Exam Schedules Service
 */
import {
    NotFoundError,
    ConflictError,
    BadRequestError,
} from '@school-erp/shared';
import { schedulesRepository, SchedulesRepository } from './schedules.repository';
import { SCHEDULE_ERROR_CODES } from './schedules.constants';
import { EXAM_STATUS } from '../exams.constants';
import type { ExamScheduleResponse, ScheduleContext } from './schedules.types';
import type { CreateScheduleInput, UpdateScheduleInput } from './schedules.validator';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

function toScheduleResponse(schedule: {
    id: string;
    examId: string;
    classId: string;
    subjectId: string;
    date: Date;
    startTime: string;
    endTime: string;
    maxMarks: number;
    passingMarks: number;
    createdAt: Date;
    class?: { id: string; name: string };
    subject?: { id: string; name: string; code: string };
}): ExamScheduleResponse {
    return {
        id: schedule.id,
        examId: schedule.examId,
        classId: schedule.classId,
        subjectId: schedule.subjectId,
        date: schedule.date.toISOString().split('T')[0],
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        maxMarks: schedule.maxMarks,
        passingMarks: schedule.passingMarks,
        createdAt: schedule.createdAt.toISOString(),
        class: schedule.class,
        subject: schedule.subject,
    };
}

export class SchedulesService {
    constructor(private readonly repository: SchedulesRepository = schedulesRepository) { }

    /**
     * Create exam schedule
     */
    async createSchedule(
        input: CreateScheduleInput,
        context: ScheduleContext
    ): Promise<ExamScheduleResponse> {
        // Validate exam
        const exam = await this.repository.findExamById(
            input.examId,
            context.tenantId,
            context.branchId
        );
        if (!exam) {
            throw new NotFoundError('Exam not found', {
                code: SCHEDULE_ERROR_CODES.EXAM_NOT_FOUND,
            });
        }
        if (exam.status === EXAM_STATUS.PUBLISHED) {
            throw new BadRequestError('Cannot add schedule to published exam', {
                code: SCHEDULE_ERROR_CODES.EXAM_PUBLISHED,
            });
        }

        // Validate class
        const classEntity = await this.repository.findClassById(
            input.classId,
            context.tenantId,
            context.branchId
        );
        if (!classEntity) {
            throw new NotFoundError('Class not found', {
                code: SCHEDULE_ERROR_CODES.CLASS_NOT_FOUND,
            });
        }

        // Validate subject
        const subject = await this.repository.findSubjectById(input.subjectId, context.tenantId);
        if (!subject) {
            throw new NotFoundError('Subject not found', {
                code: SCHEDULE_ERROR_CODES.SUBJECT_NOT_FOUND,
            });
        }

        // Validate subject mapped to class
        const mapping = await this.repository.findClassSubjectMapping(input.classId, input.subjectId);
        if (!mapping) {
            throw new BadRequestError('Subject is not mapped to this class', {
                code: SCHEDULE_ERROR_CODES.SUBJECT_NOT_MAPPED,
            });
        }

        const scheduleDate = new Date(input.date);

        // Check for conflicts
        const conflict = await this.repository.findConflicting(
            input.classId,
            scheduleDate,
            input.startTime,
            input.endTime
        );
        if (conflict) {
            throw new ConflictError('Schedule time conflicts with existing schedule', {
                code: SCHEDULE_ERROR_CODES.TIME_CONFLICT,
            });
        }

        const schedule = await this.repository.create({
            examId: input.examId,
            classId: input.classId,
            subjectId: input.subjectId,
            date: scheduleDate,
            startTime: input.startTime,
            endTime: input.endTime,
            maxMarks: input.maxMarks,
            passingMarks: input.passingMarks,
        });

        logger.info('Exam schedule created', {
            scheduleId: schedule.id,
            examId: input.examId,
            classId: input.classId,
            createdBy: context.userId,
        });

        return toScheduleResponse(schedule);
    }

    /**
     * Get schedule by ID
     */
    async getScheduleById(id: string): Promise<ExamScheduleResponse> {
        const schedule = await this.repository.findById(id);
        if (!schedule) {
            throw new NotFoundError('Schedule not found', {
                code: SCHEDULE_ERROR_CODES.NOT_FOUND,
            });
        }
        return toScheduleResponse(schedule);
    }

    /**
     * List schedules by exam
     */
    async listByExam(examId: string): Promise<ExamScheduleResponse[]> {
        const schedules = await this.repository.findByExam(examId);
        return schedules.map(toScheduleResponse);
    }

    /**
     * List schedules by class
     */
    async listByClass(classId: string): Promise<ExamScheduleResponse[]> {
        const schedules = await this.repository.findByClass(classId);
        return schedules.map(toScheduleResponse);
    }

    /**
     * Update schedule
     */
    async updateSchedule(
        id: string,
        input: UpdateScheduleInput,
        context: ScheduleContext
    ): Promise<ExamScheduleResponse> {
        const schedule = await this.repository.findById(id);
        if (!schedule) {
            throw new NotFoundError('Schedule not found', {
                code: SCHEDULE_ERROR_CODES.NOT_FOUND,
            });
        }

        // Check exam status
        const exam = await this.repository.findExamById(
            schedule.examId,
            context.tenantId,
            context.branchId
        );
        if (exam?.status === EXAM_STATUS.PUBLISHED) {
            throw new BadRequestError('Cannot modify schedule of published exam', {
                code: SCHEDULE_ERROR_CODES.EXAM_PUBLISHED,
            });
        }

        const scheduleDate = input.date ? new Date(input.date) : undefined;

        const updated = await this.repository.update(id, {
            date: scheduleDate,
            startTime: input.startTime,
            endTime: input.endTime,
            maxMarks: input.maxMarks,
            passingMarks: input.passingMarks,
        });

        logger.info('Schedule updated', { scheduleId: id, updatedBy: context.userId });

        return toScheduleResponse(updated);
    }

    /**
     * Delete schedule
     */
    async deleteSchedule(id: string, context: ScheduleContext): Promise<void> {
        const schedule = await this.repository.findById(id);
        if (!schedule) {
            throw new NotFoundError('Schedule not found', {
                code: SCHEDULE_ERROR_CODES.NOT_FOUND,
            });
        }

        const exam = await this.repository.findExamById(
            schedule.examId,
            context.tenantId,
            context.branchId
        );
        if (exam?.status === EXAM_STATUS.PUBLISHED) {
            throw new BadRequestError('Cannot delete schedule of published exam', {
                code: SCHEDULE_ERROR_CODES.EXAM_PUBLISHED,
            });
        }

        await this.repository.delete(id);
        logger.info('Schedule deleted', { scheduleId: id, deletedBy: context.userId });
    }
}

export const schedulesService = new SchedulesService();
