/**
 * Class-Subjects Repository
 * Prisma database access layer
 */
import { db } from '@school-erp/database';

const classSubjectSelectFields = {
    classId: true,
    subjectId: true,
    isMandatory: true,
    periodsPerWeek: true,
    createdAt: true,
    subject: {
        select: {
            id: true,
            name: true,
            code: true,
            type: true,
        },
    },
} as const;

export class ClassSubjectsRepository {
    /**
     * Find class by ID with tenant + branch validation
     */
    async findClassById(classId: string, tenantId: string, branchId: string) {
        return db.class.findFirst({
            where: {
                id: classId,
                tenantId,
                branchId,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                tenantId: true,
                branchId: true,
            },
        });
    }

    /**
     * Find subject by ID with tenant validation
     */
    async findSubjectById(subjectId: string, tenantId: string) {
        return db.subject.findFirst({
            where: {
                id: subjectId,
                tenantId,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                code: true,
                tenantId: true,
                deletedAt: true,
            },
        });
    }

    /**
     * Find class-subject mapping
     */
    async findClassSubject(classId: string, subjectId: string) {
        return db.classSubject.findUnique({
            where: {
                classId_subjectId: {
                    classId,
                    subjectId,
                },
            },
            select: classSubjectSelectFields,
        });
    }

    /**
     * List all subjects for a class
     */
    async findByClassId(classId: string) {
        return db.classSubject.findMany({
            where: { classId },
            select: classSubjectSelectFields,
            orderBy: { subject: { name: 'asc' } },
        });
    }

    /**
     * Assign a subject to a class
     */
    async create(data: {
        classId: string;
        subjectId: string;
        isMandatory: boolean;
        periodsPerWeek?: number;
    }) {
        return db.classSubject.create({
            data: {
                classId: data.classId,
                subjectId: data.subjectId,
                isMandatory: data.isMandatory,
                periodsPerWeek: data.periodsPerWeek,
            },
            select: classSubjectSelectFields,
        });
    }

    /**
     * Remove a subject from a class
     */
    async delete(classId: string, subjectId: string) {
        return db.classSubject.delete({
            where: {
                classId_subjectId: {
                    classId,
                    subjectId,
                },
            },
        });
    }

    /**
     * Check if class-subject has dependencies (timetable, exams)
     */
    async hasDependencies(classId: string, subjectId: string) {
        const [timetableCount, examScheduleCount] = await Promise.all([
            db.timetableEntry.count({
                where: {
                    timetable: { classId },
                    subjectId,
                },
            }),
            db.examSchedule.count({
                where: {
                    classId,
                    subjectId,
                },
            }),
        ]);

        return timetableCount > 0 || examScheduleCount > 0;
    }
}

export const classSubjectsRepository = new ClassSubjectsRepository();
