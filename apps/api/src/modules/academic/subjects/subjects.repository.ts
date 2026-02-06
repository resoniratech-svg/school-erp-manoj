/**
 * Subjects Repository
 * Prisma database access layer with tenant isolation
 */
import { db } from '@school-erp/database';
import type { Prisma } from '@school-erp/database';
import type { SubjectListFilters } from './subjects.types';

const subjectSelectFields = {
    id: true,
    tenantId: true,
    name: true,
    code: true,
    type: true,
    creditHours: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
} as const;

export class SubjectsRepository {
    /**
     * Find subject by ID with tenant isolation
     */
    async findById(id: string, tenantId: string) {
        return db.subject.findFirst({
            where: {
                id,
                tenantId,
                deletedAt: null,
            },
            select: subjectSelectFields,
        });
    }

    /**
     * Find subject by code within tenant (for uniqueness check)
     */
    async findByCode(code: string, tenantId: string) {
        return db.subject.findFirst({
            where: {
                code,
                tenantId,
                deletedAt: null,
            },
            select: subjectSelectFields,
        });
    }

    /**
     * Find subject by name within tenant (for uniqueness check)
     */
    async findByName(name: string, tenantId: string) {
        return db.subject.findFirst({
            where: {
                name,
                tenantId,
                deletedAt: null,
            },
            select: subjectSelectFields,
        });
    }

    /**
     * List subjects with filtering and pagination
     */
    async findMany(
        tenantId: string,
        options: {
            skip: number;
            take: number;
            orderBy: Prisma.SubjectOrderByWithRelationInput;
            filters?: SubjectListFilters;
        }
    ) {
        const where: Prisma.SubjectWhereInput = {
            tenantId,
            deletedAt: null,
        };

        if (options.filters?.type) {
            where.type = options.filters.type as any;
        }

        if (options.filters?.search) {
            where.OR = [
                { name: { contains: options.filters.search, mode: 'insensitive' } },
                { code: { contains: options.filters.search, mode: 'insensitive' } },
            ];
        }

        const [subjects, total] = await Promise.all([
            db.subject.findMany({
                where,
                select: subjectSelectFields,
                skip: options.skip,
                take: options.take,
                orderBy: options.orderBy,
            }),
            db.subject.count({ where }),
        ]);

        return { subjects, total };
    }

    /**
     * Create a new subject
     */
    async create(data: {
        tenantId: string;
        name: string;
        code: string;
        type: string;
        creditHours?: number;
        description?: string;
    }) {
        return db.subject.create({
            data: {
                tenantId: data.tenantId,
                name: data.name,
                code: data.code,
                type: data.type as any,
                creditHours: data.creditHours,
                description: data.description,
            },
            select: subjectSelectFields,
        });
    }

    /**
     * Update a subject
     */
    async update(id: string, data: Prisma.SubjectUpdateInput) {
        return db.subject.update({
            where: { id },
            data,
            select: subjectSelectFields,
        });
    }

    /**
     * Soft delete a subject
     */
    async softDelete(id: string) {
        return db.subject.update({
            where: { id },
            data: { deletedAt: new Date() },
            select: subjectSelectFields,
        });
    }

    /**
     * Check if subject has dependencies (class-subjects mappings)
     */
    async hasDependencies(id: string) {
        const classSubjectCount = await db.classSubject.count({
            where: { subjectId: id },
        });

        return classSubjectCount > 0;
    }
}

export const subjectsRepository = new SubjectsRepository();
