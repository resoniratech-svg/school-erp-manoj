/**
 * Timetable Repository
 * Prisma database access layer with branch isolation
 */
import { db } from '@school-erp/database';
import type { DayOfWeek } from './timetable.constants';

const timetableSelectFields = {
    id: true,
    tenantId: true,
    branchId: true,
    academicYearId: true,
    classId: true,
    sectionId: true,
    effectiveFrom: true,
    effectiveTo: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
} as const;

const timetableWithRelationsSelect = {
    ...timetableSelectFields,
    class: {
        select: {
            id: true,
            name: true,
            code: true,
        },
    },
    section: {
        select: {
            id: true,
            name: true,
            code: true,
        },
    },
    entries: {
        select: {
            id: true,
            dayOfWeek: true,
            periodId: true,
            subjectId: true,
            teacherId: true,
            period: {
                select: {
                    id: true,
                    name: true,
                    startTime: true,
                    endTime: true,
                },
            },
            subject: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
            teacher: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    },
} as const;

export class TimetableRepository {
    /**
     * Find timetable by ID with branch isolation
     */
    async findById(id: string, tenantId: string, branchId: string) {
        return db.timetable.findFirst({
            where: {
                id,
                tenantId,
                branchId,
                deletedAt: null,
            },
            select: timetableWithRelationsSelect,
        });
    }

    /**
     * Find timetables with filters
     */
    async findMany(
        tenantId: string,
        branchId: string,
        filters?: {
            academicYearId?: string;
            classId?: string;
            isActive?: boolean;
        }
    ) {
        return db.timetable.findMany({
            where: {
                tenantId,
                branchId,
                deletedAt: null,
                ...(filters?.academicYearId && { academicYearId: filters.academicYearId }),
                ...(filters?.classId && { classId: filters.classId }),
                ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
            },
            select: timetableWithRelationsSelect,
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Find timetable for a class + section
     */
    async findByClassSection(
        tenantId: string,
        branchId: string,
        classId: string,
        sectionId?: string
    ) {
        return db.timetable.findMany({
            where: {
                tenantId,
                branchId,
                classId,
                ...(sectionId && { sectionId }),
                isActive: true,
                deletedAt: null,
            },
            select: timetableWithRelationsSelect,
        });
    }

    /**
     * Find all timetable entries for a teacher
     */
    async findByTeacher(tenantId: string, branchId: string, teacherId: string) {
        return db.timetableEntry.findMany({
            where: {
                teacherId,
                timetable: {
                    tenantId,
                    branchId,
                    isActive: true,
                    deletedAt: null,
                },
            },
            select: {
                id: true,
                dayOfWeek: true,
                periodId: true,
                subjectId: true,
                teacherId: true,
                timetable: {
                    select: {
                        id: true,
                        class: { select: { id: true, name: true } },
                        section: { select: { id: true, name: true } },
                    },
                },
                period: {
                    select: { id: true, name: true, startTime: true, endTime: true },
                },
                subject: {
                    select: { id: true, name: true, code: true },
                },
            },
        });
    }

    /**
     * Create a timetable
     */
    async create(data: {
        tenantId: string;
        branchId: string;
        academicYearId: string;
        classId: string;
        sectionId: string;
        effectiveFrom: Date;
        effectiveTo?: Date;
    }) {
        return db.timetable.create({
            data: {
                tenantId: data.tenantId,
                branchId: data.branchId,
                academicYearId: data.academicYearId,
                classId: data.classId,
                sectionId: data.sectionId,
                effectiveFrom: data.effectiveFrom,
                effectiveTo: data.effectiveTo,
                isActive: true,
            },
            select: timetableWithRelationsSelect,
        });
    }

    /**
     * Create a timetable entry
     */
    async createEntry(data: {
        timetableId: string;
        dayOfWeek: DayOfWeek;
        periodId: string;
        subjectId: string;
        teacherId: string;
    }) {
        return db.timetableEntry.create({
            data: {
                timetableId: data.timetableId,
                dayOfWeek: data.dayOfWeek,
                periodId: data.periodId,
                subjectId: data.subjectId,
                teacherId: data.teacherId,
            },
            select: {
                id: true,
                dayOfWeek: true,
                periodId: true,
                subjectId: true,
                teacherId: true,
                period: {
                    select: { id: true, name: true, startTime: true, endTime: true },
                },
                subject: {
                    select: { id: true, name: true, code: true },
                },
                teacher: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }

    /**
     * Delete a timetable entry
     */
    async deleteEntry(entryId: string) {
        return db.timetableEntry.delete({
            where: { id: entryId },
        });
    }

    /**
     * Find timetable entry by ID
     */
    async findEntryById(entryId: string) {
        return db.timetableEntry.findUnique({
            where: { id: entryId },
            select: {
                id: true,
                timetableId: true,
                dayOfWeek: true,
                periodId: true,
                subjectId: true,
                teacherId: true,
            },
        });
    }

    /**
     * Update timetable
     */
    async update(id: string, data: {
        effectiveFrom?: Date;
        effectiveTo?: Date | null;
        isActive?: boolean;
    }) {
        return db.timetable.update({
            where: { id },
            data,
            select: timetableWithRelationsSelect,
        });
    }

    /**
     * Soft delete timetable and its entries
     */
    async softDelete(id: string) {
        return db.$transaction([
            db.timetableEntry.deleteMany({
                where: { timetableId: id },
            }),
            db.timetable.update({
                where: { id },
                data: { deletedAt: new Date() },
                select: timetableSelectFields,
            }),
        ]);
    }

    /**
     * Check teacher conflict - is teacher busy at this day + period?
     */
    async checkTeacherConflict(
        tenantId: string,
        branchId: string,
        teacherId: string,
        dayOfWeek: string,
        periodId: string,
        excludeEntryId?: string
    ) {
        const conflict = await db.timetableEntry.findFirst({
            where: {
                teacherId,
                dayOfWeek,
                periodId,
                ...(excludeEntryId && { id: { not: excludeEntryId } }),
                timetable: {
                    tenantId,
                    branchId,
                    isActive: true,
                    deletedAt: null,
                },
            },
            select: {
                id: true,
                timetable: {
                    select: {
                        class: { select: { name: true } },
                        section: { select: { name: true } },
                    },
                },
            },
        });
        return conflict;
    }

    /**
     * Check section conflict - is section already has class at this day + period?
     */
    async checkSectionConflict(
        timetableId: string,
        dayOfWeek: string,
        periodId: string,
        excludeEntryId?: string
    ) {
        const conflict = await db.timetableEntry.findFirst({
            where: {
                timetableId,
                dayOfWeek,
                periodId,
                ...(excludeEntryId && { id: { not: excludeEntryId } }),
            },
            select: {
                id: true,
                subject: { select: { name: true } },
            },
        });
        return conflict;
    }

    // Validation helpers
    async findClassById(classId: string, tenantId: string, branchId: string) {
        return db.class.findFirst({
            where: { id: classId, tenantId, branchId, deletedAt: null },
            select: { id: true, academicYearId: true },
        });
    }

    async findSectionById(sectionId: string, classId: string) {
        return db.section.findFirst({
            where: { id: sectionId, classId, deletedAt: null },
            select: { id: true, classId: true },
        });
    }

    async findAcademicYearById(academicYearId: string, tenantId: string) {
        return db.academicYear.findFirst({
            where: { id: academicYearId, tenantId },
            select: { id: true },
        });
    }

    async findPeriodById(periodId: string, tenantId: string, branchId: string) {
        return db.period.findFirst({
            where: { id: periodId, tenantId, branchId, deletedAt: null },
            select: { id: true },
        });
    }

    async findSubjectById(subjectId: string, tenantId: string) {
        return db.subject.findFirst({
            where: { id: subjectId, tenantId, deletedAt: null },
            select: { id: true },
        });
    }

    async findTeacherById(teacherId: string, tenantId: string) {
        return db.staff.findFirst({
            where: { id: teacherId, tenantId, deletedAt: null },
            select: { id: true, branchId: true, status: true },
        });
    }

    async findClassSubjectMapping(classId: string, subjectId: string) {
        return db.classSubject.findUnique({
            where: { classId_subjectId: { classId, subjectId } },
        });
    }
}

export const timetableRepository = new TimetableRepository();
