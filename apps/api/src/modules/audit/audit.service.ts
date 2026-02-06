/**
 * Audit Module Service
 * READ-ONLY - NO create, update, delete operations
 */
import { NotFoundError } from '@school-erp/shared';
import { AuditRepository, auditRepository } from './audit.repository';
import { AUDIT_ERROR_CODES, PAGINATION } from './audit.constants';
import { mapAuditLogToResponse } from './audit.mapper';
import type { AuditLogResponse, AuditLogListResponse, AuditContext } from './audit.types';
import type { AuditFilterInput } from './audit.validator';

export class AuditService {
    constructor(private readonly repository: AuditRepository = auditRepository) { }

    /**
     * Get single audit log by ID
     */
    async getLogById(id: string, context: AuditContext): Promise<AuditLogResponse> {
        const log = await this.repository.findById(id, context.tenantId);

        if (!log) {
            throw new NotFoundError(AUDIT_ERROR_CODES.LOG_NOT_FOUND);
        }

        // Branch-level check if context has branchId
        if (context.branchId && log.branchId !== context.branchId) {
            throw new NotFoundError(AUDIT_ERROR_CODES.LOG_NOT_FOUND);
        }

        return mapAuditLogToResponse(log);
    }

    /**
     * List audit logs with filters and pagination
     */
    async listLogs(
        filters: AuditFilterInput,
        context: AuditContext
    ): Promise<AuditLogListResponse> {
        const page = filters.page || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(filters.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

        const { logs, total } = await this.repository.findLogs(
            context.tenantId,
            context.branchId,
            { ...filters, page, limit }
        );

        return {
            logs: logs.map(log => mapAuditLogToResponse(log as Parameters<typeof mapAuditLogToResponse>[0])),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get available filter options
     */
    async getFilterOptions(context: AuditContext): Promise<{
        modules: string[];
        entities: string[];
        actions: string[];
    }> {
        const [modules, entities, actions] = await Promise.all([
            this.repository.getDistinctModules(context.tenantId),
            this.repository.getDistinctEntities(context.tenantId),
            this.repository.getDistinctActions(context.tenantId),
        ]);

        return { modules, entities, actions };
    }

    // NO create method - Audit logs are written by other modules
    // NO update method - Audit logs are immutable
    // NO delete method - Audit logs are permanent
}

export const auditService = new AuditService();
