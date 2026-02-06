/**
 * Audit Module Controller
 * READ-ONLY - NO create, update, delete endpoints
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@school-erp/shared';
import { auditService, AuditService } from './audit.service';
import { getRequestContext } from '../authz';
import type { AuditFilterInput } from './audit.validator';

export class AuditController {
    constructor(private readonly service: AuditService = auditService) { }

    /**
     * List audit logs with filters
     */
    listLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const filters = req.query as unknown as AuditFilterInput;

            const result = await this.service.listLogs(filters, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(result, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get single audit log by ID
     */
    getLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const log = await this.service.getLogById(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(log, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get available filter options
     */
    getFilterOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);

            const options = await this.service.getFilterOptions({
                tenantId: context.tenant.id,
                branchId: context.branch?.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(options, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    // NO create, update, delete endpoints
}

export const auditController = new AuditController();
