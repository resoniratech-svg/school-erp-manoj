/**
 * Jobs Controller
 * READ + RETRY only - NO manual job creation via API
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@school-erp/shared';
import { jobsService, JobsService } from './jobs.service';
import { getRequestContext } from '../authz';
import { getWorkerStatus } from './jobs.worker';

export class JobsController {
    constructor(private readonly service: JobsService = jobsService) { }

    /**
     * GET /jobs - List jobs
     */
    listJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { type, status, page, limit } = req.query;

            const result = await this.service.listJobs(
                {
                    type: type as string,
                    status: status as string,
                    page: page ? parseInt(page as string, 10) : undefined,
                    limit: limit ? parseInt(limit as string, 10) : undefined,
                },
                {
                    tenantId: context.tenant.id,
                    branchId: context.branch?.id,
                    userId: context.user.id,
                }
            );

            res.status(200).json(
                createApiResponse(result, {
                    meta: { requestId: (req as Request & { requestId?: string }).requestId },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /jobs/:id - Get job by ID
     */
    getJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const result = await this.service.getJobById(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(result, {
                    meta: { requestId: (req as Request & { requestId?: string }).requestId },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /jobs/:id/retry - Retry failed job
     */
    retryJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const result = await this.service.retryJob(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(result, {
                    message: 'Job retry initiated',
                    meta: { requestId: (req as Request & { requestId?: string }).requestId },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /jobs/status - Get worker status (admin)
     */
    getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = getWorkerStatus();

            res.status(200).json(
                createApiResponse(status, {
                    meta: { requestId: (req as Request & { requestId?: string }).requestId },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    // NO CREATE endpoint - jobs are created internally
    // NO DELETE endpoint - jobs are append-only
}

export const jobsController = new JobsController();
