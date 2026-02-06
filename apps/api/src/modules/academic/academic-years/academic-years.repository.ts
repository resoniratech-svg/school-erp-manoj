/**
 * Academic Years Repository
 * Prisma database access layer with tenant isolation
 */
import { db } from '@school-erp/database';
import type { Prisma } from '@school-erp/database';
import type { AcademicYearListFilters } from './academic-years.types';

const academicYearSelectFields = {
    id: true,
    tenantId: true,
    name: true,
    startDate: true,
    endDate: true,
    isCurrent: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} as const;

export class AcademicYearsRepository {
    /**
     * Find academic year by ID with tenant isolation
     */
    async findById(id: string, tenantId: string) {
        return db.academicYear.findFirst({
            where: {
                id,
                tenantId,
            },
            select: academicYearSelectFields,
        });
    }

    /**
     * Find academic year by name with tenant isolation
     */
    async findByName(name: string, tenantId: string) {
        return db.academicYear.findFirst({
            where: {
                name,
                tenantId,
            },
            select: academicYearSelectFields,
        });
    }

    /**
     * Find current active academic year for a tenant
     */
    async findCurrent(tenantId: string) {
        return db.academicYear.findFirst({
            where: {
                tenantId,
                isCurrent: true,
            },
            select: academicYearSelectFields,
        });
    }

    /**
     * List academic years with filtering and pagination
     */
    async findMany(
        tenantId: string,
        options: {
            skip: number;
            take: number;
            orderBy: Prisma.AcademicYearOrderByWithRelationInput;
            filters?: AcademicYearListFilters;
        }
    ) {
        const where: Prisma.AcademicYearWhereInput = {
            tenantId,
        };

        if (options.filters?.status) {
            where.status = options.filters.status as any;
        }

        if (options.filters?.isCurrent !== undefined) {
            where.isCurrent = options.filters.isCurrent;
        }

        if (options.filters?.search) {
            where.name = { contains: options.filters.search, mode: 'insensitive' };
        }

        const [academicYears, total] = await Promise.all([
            db.academicYear.findMany({
                where,
                select: academicYearSelectFields,
                skip: options.skip,
                take: options.take,
                orderBy: options.orderBy,
            }),
            db.academicYear.count({ where }),
        ]);

        return { academicYears, total };
    }

    /**
     * Create a new academic year
     */
    async create(data: {
        tenantId: string;
        name: string;
        startDate: Date;
        endDate: Date;
        status: string;
    }) {
        return db.academicYear.create({
            data: {
                tenantId: data.tenantId,
                name: data.name,
                startDate: data.startDate,
                endDate: data.endDate,
                status: data.status as any,
                isCurrent: false,
            },
            select: academicYearSelectFields,
        });
    }

    /**
     * Update an academic year
     */
    async update(id: string, _tenantId: string, data: Prisma.AcademicYearUpdateInput) {
        return db.academicYear.update({
            where: { id },
            data,
            select: academicYearSelectFields,
        });
    }

    /**
     * Activate an academic year atomically
     * Deactivates all other years for the tenant and activates the specified one
     */
    async activateAtomic(id: string, tenantId: string) {
        return db.$transaction(async (tx: typeof db) => {
            // Deactivate all other years for this tenant
            await tx.academicYear.updateMany({
                where: {
                    tenantId,
                    isCurrent: true,
                },
                data: {
                    isCurrent: false,
                },
            });

            // Activate the specified year
            return tx.academicYear.update({
                where: { id },
                data: {
                    isCurrent: true,
                    status: 'active',
                },
                select: academicYearSelectFields,
            });
        });
    }

    /**
     * Check if academic year has dependent data
     */
    async hasDependencies(id: string) {
        const [classCount, enrollmentCount] = await Promise.all([
            db.class.count({ where: { academicYearId: id } }),
            db.studentEnrollment.count({ where: { academicYearId: id } }),
        ]);

        return classCount > 0 || enrollmentCount > 0;
    }

    /**
     * Delete academic year (no soft-delete field on AcademicYear model, so we use real delete)
     * Note: The schema doesn't have deletedAt on AcademicYear, so we enforce business rules in service
     */
    async delete(id: string) {
        return db.academicYear.delete({
            where: { id },
        });
    }
}

export const academicYearsRepository = new AcademicYearsRepository();
