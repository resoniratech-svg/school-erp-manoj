/**
 * Classes Repository
 * Prisma database access layer with tenant + branch isolation
 */
import { db } from '@school-erp/database';
import type { Prisma } from '@school-erp/database';
import type { ClassListFilters } from './classes.types';

const classSelectFields = {
    id: true,
    tenantId: true,
    branchId: true,
    academicYearId: true,
    name: true,
    code: true,
    displayOrder: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
} as const;

const classWithRelationsSelect = {
    ...classSelectFields,
    academicYear: {
        select: {
            id: true,
            name: true,
        },
    },
    _count: {
        select: {
            sections: true,
        },
    },
} as const;

export class ClassesRepository {
    /**
     * Find class by ID with tenant + branch isolation
     */
    async findById(id: string, tenantId: string, branchId: string) {
        return db.class.findFirst({
            where: {
                id,
                tenantId,
                branchId,
                deletedAt: null,
            },
            select: classSelectFields,
        });
    }

    /**
     * Find class by ID with relations
     */
    async findByIdWithRelations(id: string, tenantId: string, branchId: string) {
        return db.class.findFirst({
            where: {
                id,
                tenantId,
                branchId,
                deletedAt: null,
            },
            select: classWithRelationsSelect,
        });
    }

    /**
     * Find class by code within branch + academic year (for uniqueness check)
     */
    async findByCode(
        code: string,
        tenantId: string,
        branchId: string,
        academicYearId: string
    ) {
        return db.class.findFirst({
            where: {
                code,
                tenantId,
                branchId,
                academicYearId,
                deletedAt: null,
            },
            select: classSelectFields,
        });
    }

    /**
     * List classes with filtering and pagination
     */
    async findMany(
        tenantId: string,
        options: {
            skip: number;
            take: number;
            orderBy: Prisma.ClassOrderByWithRelationInput;
            filters: ClassListFilters;
        }
    ) {
        const where: Prisma.ClassWhereInput = {
            tenantId,
            branchId: options.filters.branchId,
            academicYearId: options.filters.academicYearId,
            deletedAt: null,
        };

        if (options.filters.search) {
            where.OR = [
                { name: { contains: options.filters.search, mode: 'insensitive' } },
                { code: { contains: options.filters.search, mode: 'insensitive' } },
            ];
        }

        const [classes, total] = await Promise.all([
            db.class.findMany({
                where,
                select: classSelectFields,
                skip: options.skip,
                take: options.take,
                orderBy: options.orderBy,
            }),
            db.class.count({ where }),
        ]);

        return { classes, total };
    }

    /**
     * Create a new class
     */
    async create(data: {
        tenantId: string;
        branchId: string;
        academicYearId: string;
        name: string;
        code: string;
        displayOrder: number;
        description?: string;
    }) {
        return db.class.create({
            data: {
                tenantId: data.tenantId,
                branchId: data.branchId,
                academicYearId: data.academicYearId,
                name: data.name,
                code: data.code,
                displayOrder: data.displayOrder,
                description: data.description,
            },
            select: classSelectFields,
        });
    }

    /**
     * Update a class
     */
    async update(id: string, data: Prisma.ClassUpdateInput) {
        return db.class.update({
            where: { id },
            data,
            select: classSelectFields,
        });
    }

    /**
     * Soft delete a class
     */
    async softDelete(id: string) {
        return db.class.update({
            where: { id },
            data: { deletedAt: new Date() },
            select: classSelectFields,
        });
    }

    /**
     * Check if class has dependencies (sections, enrollments, etc.)
     */
    async hasDependencies(id: string) {
        const [sectionCount, enrollmentCount] = await Promise.all([
            db.section.count({ where: { classId: id, deletedAt: null } }),
            db.studentEnrollment.count({ where: { classId: id } }),
        ]);

        return sectionCount > 0 || enrollmentCount > 0;
    }

    /**
     * Find academic year by ID (for validation)
     */
    async findAcademicYearById(academicYearId: string, tenantId: string) {
        return db.academicYear.findFirst({
            where: {
                id: academicYearId,
                tenantId,
            },
            select: {
                id: true,
                name: true,
                tenantId: true,
            },
        });
    }

    /**
     * Find branch by ID (for validation)
     */
    async findBranchById(branchId: string, tenantId: string) {
        return db.branch.findFirst({
            where: {
                id: branchId,
                tenantId,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                tenantId: true,
            },
        });
    }
}

export const classesRepository = new ClassesRepository();
