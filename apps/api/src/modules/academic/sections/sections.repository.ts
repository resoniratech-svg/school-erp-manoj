/**
 * Sections Repository
 * Prisma database access layer with tenant + branch isolation via class
 */
import { db } from '@school-erp/database';
import type { Prisma } from '@school-erp/database';
import type { SectionListFilters } from './sections.types';

const sectionSelectFields = {
    id: true,
    classId: true,
    name: true,
    code: true,
    capacity: true,
    room: true,
    classTeacherId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
} as const;

const sectionWithRelationsSelect = {
    ...sectionSelectFields,
    class: {
        select: {
            id: true,
            name: true,
            code: true,
            tenantId: true,
            branchId: true,
        },
    },
    classTeacher: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
        },
    },
} as const;

export class SectionsRepository {
    /**
     * Find section by ID with class info for tenant/branch validation
     */
    async findById(id: string) {
        return db.section.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            select: sectionWithRelationsSelect,
        });
    }

    /**
     * Find section by code within a class (for uniqueness check)
     */
    async findByCode(code: string, classId: string) {
        return db.section.findFirst({
            where: {
                code,
                classId,
                deletedAt: null,
            },
            select: sectionSelectFields,
        });
    }

    /**
     * List sections with filtering and pagination
     */
    async findMany(
        options: {
            skip: number;
            take: number;
            orderBy: Prisma.SectionOrderByWithRelationInput;
            filters: SectionListFilters;
        }
    ) {
        const where: Prisma.SectionWhereInput = {
            classId: options.filters.classId,
            deletedAt: null,
        };

        if (options.filters.search) {
            where.OR = [
                { name: { contains: options.filters.search, mode: 'insensitive' } },
                { code: { contains: options.filters.search, mode: 'insensitive' } },
            ];
        }

        const [sections, total] = await Promise.all([
            db.section.findMany({
                where,
                select: sectionSelectFields,
                skip: options.skip,
                take: options.take,
                orderBy: options.orderBy,
            }),
            db.section.count({ where }),
        ]);

        return { sections, total };
    }

    /**
     * Create a new section
     */
    async create(data: {
        classId: string;
        name: string;
        code: string;
        capacity?: number;
        room?: string;
        classTeacherId?: string;
    }) {
        return db.section.create({
            data: {
                classId: data.classId,
                name: data.name,
                code: data.code,
                capacity: data.capacity,
                room: data.room,
                classTeacherId: data.classTeacherId,
            },
            select: sectionSelectFields,
        });
    }

    /**
     * Update a section
     */
    async update(id: string, data: Prisma.SectionUpdateInput) {
        return db.section.update({
            where: { id },
            data,
            select: sectionSelectFields,
        });
    }

    /**
     * Soft delete a section
     */
    async softDelete(id: string) {
        return db.section.update({
            where: { id },
            data: { deletedAt: new Date() },
            select: sectionSelectFields,
        });
    }

    /**
     * Check if section has dependencies (enrollments, timetable, etc.)
     */
    async hasDependencies(id: string) {
        const [enrollmentCount, timetableCount] = await Promise.all([
            db.studentEnrollment.count({ where: { sectionId: id } }),
            db.timetable.count({ where: { sectionId: id } }),
        ]);

        return enrollmentCount > 0 || timetableCount > 0;
    }

    /**
     * Find class by ID (for validation)
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
                academicYearId: true,
            },
        });
    }

    /**
     * Find staff by ID (for class teacher validation)
     */
    async findStaffById(staffId: string, tenantId: string) {
        return db.staff.findFirst({
            where: {
                id: staffId,
                tenantId,
                deletedAt: null,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                tenantId: true,
                status: true,
            },
        });
    }
}

export const sectionsRepository = new SectionsRepository();
