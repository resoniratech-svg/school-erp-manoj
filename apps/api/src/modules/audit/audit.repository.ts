/**
 * Audit Module Repository
 * READ-ONLY - NO create, update, delete methods exposed
 */
import { prisma } from '@school-erp/database';
import { PAGINATION } from './audit.constants';
import type { AuditFilterInput } from './audit.validator';

export class AuditRepository {
    /**
     * Find audit log by ID (tenant-scoped)
     */
    async findById(id: string, tenantId: string) {
        return prisma.auditLog.findFirst({
            where: { id, tenantId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    /**
     * Find audit logs with filters and pagination
     */
    async findLogs(
        tenantId: string,
        branchId: string | undefined,
        filters: AuditFilterInput
    ): Promise<{ logs: unknown[]; total: number }> {
        const page = filters.page || PAGINATION.DEFAULT_PAGE;
        const limit = filters.limit || PAGINATION.DEFAULT_LIMIT;
        const skip = (page - 1) * limit;

        const where = {
            tenantId,
            ...(branchId && { branchId }),
            ...(filters.module && { module: filters.module }),
            ...(filters.entity && { entity: filters.entity }),
            ...(filters.action && { action: filters.action }),
            ...(filters.userId && { userId: filters.userId }),
            ...(filters.startDate && {
                createdAt: {
                    gte: new Date(filters.startDate),
                },
            }),
            ...(filters.endDate && {
                createdAt: {
                    ...(filters.startDate && { gte: new Date(filters.startDate) }),
                    lte: new Date(filters.endDate + 'T23:59:59.999Z'),
                },
            }),
        };

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.auditLog.count({ where }),
        ]);

        return { logs, total };
    }

    /**
     * Get distinct values for filters
     */
    async getDistinctModules(tenantId: string): Promise<string[]> {
        const result = await prisma.auditLog.findMany({
            where: { tenantId },
            select: { module: true },
            distinct: ['module'],
        });
        return result.map((r) => r.module);
    }

    async getDistinctEntities(tenantId: string): Promise<string[]> {
        const result = await prisma.auditLog.findMany({
            where: { tenantId },
            select: { entity: true },
            distinct: ['entity'],
        });
        return result.map((r) => r.entity);
    }

    async getDistinctActions(tenantId: string): Promise<string[]> {
        const result = await prisma.auditLog.findMany({
            where: { tenantId },
            select: { action: true },
            distinct: ['action'],
        });
        return result.map((r) => r.action);
    }

    // NO create, update, delete methods - Audit logs are written by other modules
}

export const auditRepository = new AuditRepository();
