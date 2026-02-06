/**
 * Marks Controller
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@school-erp/shared';
import { marksService, MarksService } from './marks.service';
import { getRequestContext } from '../../authz';
import type { BulkEnterMarksInput, UpdateMarksInput } from './marks.validator';

export class MarksController {
    constructor(private readonly service: MarksService = marksService) { }

    bulkEnterMarks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as BulkEnterMarksInput;

            const marks = await this.service.bulkEnterMarks(input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(201).json(
                createApiResponse({ marks }, {
                    message: `Marks entered for ${marks.length} students`,
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getMarks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const marks = await this.service.getMarksById(id);

            res.status(200).json(
                createApiResponse(marks, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    listMarks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { examScheduleId } = req.query;

            const marks = examScheduleId
                ? await this.service.getMarksBySchedule(examScheduleId as string)
                : [];

            res.status(200).json(
                createApiResponse({ marks }, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    updateMarks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;
            const input = req.body as UpdateMarksInput;

            const marks = await this.service.updateMarks(id, input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(marks, {
                    message: 'Marks updated successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getStudentResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { examId, studentId } = req.params;

            const results = await this.service.getStudentResults(examId, studentId, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(results, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };
}

export const marksController = new MarksController();
