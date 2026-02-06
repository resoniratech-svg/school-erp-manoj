/**
 * Exam Schedules Repository
 */
import { db } from '@school-erp/database';

const scheduleSelectFields = {
    id: true,
    examId: true,
    classId: true,
    subjectId: true,
    date: true,
    startTime: true,
    endTime: true,
    maxMarks: true,
    passingMarks: true,
    createdAt: true,
    updatedAt: true,
} as const;

const scheduleWithRelationsSelect = {
    ...scheduleSelectFields,
    class: {
        select: { id: true, name: true },
    },
    subject: {
        select: { id: true, name: true, code: true },
    },
} as const;

export class SchedulesRepository {
    /**
     * Find schedule by ID
     */
    async findById(id: string) {
        return db.examSchedule.findUnique({
            where: { id },
            select: scheduleWithRelationsSelect,
        });
    }

    /**
     * Find schedules by exam
     */
    async findByExam(examId: string) {
        return db.examSchedule.findMany({
            where: { examId },
            select: scheduleWithRelationsSelect,
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });
    }

    /**
     * Find schedules by class
     */
    async findByClass(classId: string) {
        return db.examSchedule.findMany({
            where: { classId },
            select: scheduleWithRelationsSelect,
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });
    }

    /**
     * Check for time conflicts
     */
    async findConflicting(
        classId: string,
        date: Date,
        startTime: string,
        endTime: string,
        excludeId?: string
    ) {
        return db.examSchedule.findFirst({
            where: {
                classId,
                date,
                ...(excludeId && { id: { not: excludeId } }),
                OR: [
                    { AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }] },
                ],
            },
            select: scheduleSelectFields,
        });
    }

    /**
     * Create schedule
     */
    async create(data: {
        examId: string;
        classId: string;
        subjectId: string;
        date: Date;
        startTime: string;
        endTime: string;
        maxMarks: number;
        passingMarks: number;
    }) {
        return db.examSchedule.create({
            data,
            select: scheduleWithRelationsSelect,
        });
    }

    /**
     * Update schedule
     */
    async update(id: string, data: {
        date?: Date;
        startTime?: string;
        endTime?: string;
        maxMarks?: number;
        passingMarks?: number;
    }) {
        return db.examSchedule.update({
            where: { id },
            data,
            select: scheduleWithRelationsSelect,
        });
    }

    /**
     * Delete schedule
     */
    async delete(id: string) {
        return db.examSchedule.delete({
            where: { id },
        });
    }

    // Helpers
    async findExamById(examId: string, tenantId: string, branchId: string) {
        return db.exam.findFirst({
            where: { id: examId, tenantId, branchId, deletedAt: null },
            select: { id: true, status: true, startDate: true, endDate: true },
        });
    }

    async findClassById(classId: string, tenantId: string, branchId: string) {
        return db.class.findFirst({
            where: { id: classId, tenantId, branchId, deletedAt: null },
            select: { id: true },
        });
    }

    async findSubjectById(subjectId: string, tenantId: string) {
        return db.subject.findFirst({
            where: { id: subjectId, tenantId, deletedAt: null },
            select: { id: true },
        });
    }

    async findClassSubjectMapping(classId: string, subjectId: string) {
        return db.classSubject.findUnique({
            where: { classId_subjectId: { classId, subjectId } },
        });
    }
}

export const schedulesRepository = new SchedulesRepository();
