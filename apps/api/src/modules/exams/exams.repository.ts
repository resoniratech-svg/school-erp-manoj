/**
 * Exams Repository
 */
import { db } from '@school-erp/database';

const examSelectFields = {
    id: true,
    tenantId: true,
    branchId: true,
    academicYearId: true,
    name: true,
    type: true,
    status: true,
    startDate: true,
    endDate: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
} as const;

export class ExamsRepository {
    /**
     * Find exam by ID with branch isolation
     */
    async findById(id: string, tenantId: string, branchId: string) {
        return db.exam.findFirst({
            where: {
                id,
                tenantId,
                branchId,
                deletedAt: null,
            },
            select: examSelectFields,
        });
    }

    /**
     * Find exams with filters
     */
    async findMany(
        tenantId: string,
        branchId: string,
        filters?: {
            academicYearId?: string;
            type?: string;
            status?: string;
        }
    ) {
        return db.exam.findMany({
            where: {
                tenantId,
                branchId,
                deletedAt: null,
                ...(filters?.academicYearId && { academicYearId: filters.academicYearId }),
                ...(filters?.type && { type: filters.type }),
                ...(filters?.status && { status: filters.status }),
            },
            select: examSelectFields,
            orderBy: { startDate: 'desc' },
        });
    }

    /**
     * Check for overlapping exams
     */
    async findOverlapping(
        tenantId: string,
        branchId: string,
        academicYearId: string,
        startDate: Date,
        endDate: Date,
        excludeId?: string
    ) {
        return db.exam.findMany({
            where: {
                tenantId,
                branchId,
                academicYearId,
                deletedAt: null,
                ...(excludeId && { id: { not: excludeId } }),
                OR: [
                    { AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }] },
                ],
            },
            select: examSelectFields,
        });
    }

    /**
     * Create exam
     */
    async create(data: {
        tenantId: string;
        branchId: string;
        academicYearId: string;
        name: string;
        type: string;
        startDate: Date;
        endDate: Date;
        description?: string;
    }) {
        return db.exam.create({
            data: {
                tenantId: data.tenantId,
                branchId: data.branchId,
                academicYearId: data.academicYearId,
                name: data.name,
                type: data.type,
                status: 'draft',
                startDate: data.startDate,
                endDate: data.endDate,
                description: data.description,
            },
            select: examSelectFields,
        });
    }

    /**
     * Update exam
     */
    async update(id: string, data: {
        name?: string;
        type?: string;
        startDate?: Date;
        endDate?: Date;
        description?: string | null;
        status?: string;
    }) {
        return db.exam.update({
            where: { id },
            data,
            select: examSelectFields,
        });
    }

    /**
     * Soft delete exam
     */
    async softDelete(id: string) {
        return db.exam.update({
            where: { id },
            data: { deletedAt: new Date() },
            select: examSelectFields,
        });
    }

    // Validation helper
    async findAcademicYearById(academicYearId: string, tenantId: string) {
        return db.academicYear.findFirst({
            where: { id: academicYearId, tenantId },
            select: { id: true, startDate: true, endDate: true },
        });
    }
}

export const examsRepository = new ExamsRepository();
