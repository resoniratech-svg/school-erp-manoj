/**
 * Marks Repository
 */
import { db } from '@school-erp/database';

const marksSelectFields = {
    id: true,
    examScheduleId: true,
    studentId: true,
    marksObtained: true,
    isAbsent: true,
    remarks: true,
    grade: true,
    percentage: true,
    enteredByUserId: true,
    createdAt: true,
    updatedAt: true,
} as const;

const marksWithStudentSelect = {
    ...marksSelectFields,
    student: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
        },
    },
} as const;

export class MarksRepository {
    /**
     * Find marks by ID
     */
    async findById(id: string) {
        return db.examMarks.findUnique({
            where: { id },
            select: marksWithStudentSelect,
        });
    }

    /**
     * Find marks by schedule
     */
    async findBySchedule(examScheduleId: string) {
        return db.examMarks.findMany({
            where: { examScheduleId },
            select: marksWithStudentSelect,
            orderBy: { student: { rollNumber: 'asc' } },
        });
    }

    /**
     * Find marks by student for an exam
     */
    async findByStudentExam(studentId: string, examId: string) {
        return db.examMarks.findMany({
            where: {
                studentId,
                examSchedule: { examId },
            },
            select: {
                ...marksSelectFields,
                examSchedule: {
                    select: {
                        id: true,
                        subjectId: true,
                        maxMarks: true,
                        passingMarks: true,
                        subject: {
                            select: { id: true, name: true, code: true },
                        },
                    },
                },
            },
        });
    }

    /**
     * Find existing marks for student + schedule
     */
    async findByStudentSchedule(studentId: string, examScheduleId: string) {
        return db.examMarks.findFirst({
            where: { studentId, examScheduleId },
            select: marksSelectFields,
        });
    }

    /**
     * Bulk create marks (transaction)
     */
    async bulkCreate(entries: Array<{
        examScheduleId: string;
        studentId: string;
        marksObtained: number;
        isAbsent: boolean;
        remarks?: string;
        grade: string;
        percentage: number;
        enteredByUserId: string;
    }>) {
        return db.$transaction(
            entries.map((entry) =>
                db.examMarks.create({
                    data: entry,
                    select: marksSelectFields,
                })
            )
        );
    }

    /**
     * Update marks
     */
    async update(id: string, data: {
        marksObtained?: number;
        isAbsent?: boolean;
        remarks?: string | null;
        grade?: string;
        percentage?: number;
        enteredByUserId: string;
    }) {
        return db.examMarks.update({
            where: { id },
            data,
            select: marksWithStudentSelect,
        });
    }

    // Helpers
    async findScheduleById(id: string) {
        return db.examSchedule.findUnique({
            where: { id },
            select: {
                id: true,
                examId: true,
                classId: true,
                subjectId: true,
                date: true,
                maxMarks: true,
                passingMarks: true,
                exam: {
                    select: { id: true, status: true, tenantId: true, branchId: true },
                },
            },
        });
    }

    async findStudentById(studentId: string, tenantId: string) {
        return db.student.findFirst({
            where: { id: studentId, tenantId, deletedAt: null },
            select: { id: true, firstName: true, lastName: true, status: true },
        });
    }

    async findStudentEnrollment(studentId: string, classId: string) {
        return db.studentEnrollment.findFirst({
            where: {
                studentId,
                section: { classId },
                status: 'active',
            },
            select: { id: true },
        });
    }
}

export const marksRepository = new MarksRepository();
