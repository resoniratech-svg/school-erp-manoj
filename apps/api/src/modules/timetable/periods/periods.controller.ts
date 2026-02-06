/**
 * Periods Controller
 * HTTP request handlers
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse, createEmptyResponse } from '@school-erp/shared';
import { periodsService, PeriodsService } from './periods.service';
import { getRequestContext } from '../../authz';
import type { CreatePeriodInput, UpdatePeriodInput } from './periods.validator';

export class PeriodsController {
    constructor(private readonly service: PeriodsService = periodsService) { }

    createPeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as CreatePeriodInput;

            const period = await this.service.createPeriod(input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(201).json(
                createApiResponse(period, {
                    message: 'Period created successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getPeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const period = await this.service.getPeriodById(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(period, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    listPeriods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const branchId = (req.query.branchId as string) || context.branch?.id || '';

            const periods = await this.service.listPeriods({
                tenantId: context.tenant.id,
                branchId,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse({ periods }, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    updatePeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;
            const input = req.body as UpdatePeriodInput;

            const period = await this.service.updatePeriod(id, input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(period, {
                    message: 'Period updated successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    deletePeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            await this.service.deletePeriod(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createEmptyResponse('Period deleted successfully', req.requestId as string)
            );
        } catch (error) {
            next(error);
        }
    };
}

export const periodsController = new PeriodsController();
