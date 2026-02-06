/**
 * Periods Repository
 * Prisma database access layer with branch isolation
 */
import { db } from '@school-erp/database';

const periodSelectFields = {
    id: true,
    tenantId: true,
    branchId: true,
    name: true,
    startTime: true,
    endTime: true,
    displayOrder: true,
    periodType: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
} as const;

export class PeriodsRepository {
    /**
     * Find period by ID with branch isolation
     */
    async findById(id: string, tenantId: string, branchId: string) {
        return db.period.findFirst({
            where: {
                id,
                tenantId,
                branchId,
                deletedAt: null,
            },
            select: periodSelectFields,
        });
    }

    /**
     * Find all periods for a branch
     */
    async findByBranch(tenantId: string, branchId: string) {
        return db.period.findMany({
            where: {
                tenantId,
                branchId,
                deletedAt: null,
            },
            select: periodSelectFields,
            orderBy: { displayOrder: 'asc' },
        });
    }

    /**
     * Find overlapping periods (for conflict detection)
     */
    async findOverlapping(
        tenantId: string,
        branchId: string,
        startTime: string,
        endTime: string,
        excludeId?: string
    ) {
        const periods = await db.period.findMany({
            where: {
                tenantId,
                branchId,
                deletedAt: null,
                ...(excludeId && { id: { not: excludeId } }),
            },
            select: periodSelectFields,
        });

        // Check for overlap: (start1 < end2) && (end1 > start2)
        return periods.filter((period) => {
            return startTime < period.endTime && endTime > period.startTime;
        });
    }

    /**
     * Create a new period
     */
    async create(data: {
        tenantId: string;
        branchId: string;
        name: string;
        startTime: string;
        endTime: string;
        displayOrder: number;
        periodType?: string;
    }) {
        return db.period.create({
            data: {
                tenantId: data.tenantId,
                branchId: data.branchId,
                name: data.name,
                startTime: data.startTime,
                endTime: data.endTime,
                displayOrder: data.displayOrder,
                periodType: data.periodType || 'regular',
            },
            select: periodSelectFields,
        });
    }

    /**
     * Update a period
     */
    async update(id: string, data: {
        name?: string;
        startTime?: string;
        endTime?: string;
        displayOrder?: number;
        periodType?: string;
    }) {
        return db.period.update({
            where: { id },
            data,
            select: periodSelectFields,
        });
    }

    /**
     * Soft delete a period
     */
    async softDelete(id: string) {
        return db.period.update({
            where: { id },
            data: { deletedAt: new Date() },
            select: periodSelectFields,
        });
    }

    /**
     * Check if period is used in any timetable entry
     */
    async hasDependencies(id: string) {
        const count = await db.timetableEntry.count({
            where: { periodId: id },
        });
        return count > 0;
    }
}

export const periodsRepository = new PeriodsRepository();
