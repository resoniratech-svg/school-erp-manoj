/**
 * Exam Schedules Controller
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse, createEmptyResponse } from '@school-erp/shared';
import { schedulesService, SchedulesService } from './schedules.service';
import { getRequestContext } from '../../authz';
import type { CreateScheduleInput, UpdateScheduleInput } from './schedules.validator';

export class SchedulesController {
    constructor(private readonly service: SchedulesService = schedulesService) { }

    createSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as CreateScheduleInput;

            const schedule = await this.service.createSchedule(input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(201).json(
                createApiResponse(schedule, {
                    message: 'Schedule created successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const schedule = await this.service.getScheduleById(id);

            res.status(200).json(
                createApiResponse(schedule, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    listSchedules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { examId, classId } = req.query;

            let schedules;
            if (examId) {
                schedules = await this.service.listByExam(examId as string);
            } else if (classId) {
                schedules = await this.service.listByClass(classId as string);
            } else {
                schedules = [];
            }

            res.status(200).json(
                createApiResponse({ schedules }, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    updateSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;
            const input = req.body as UpdateScheduleInput;

            const schedule = await this.service.updateSchedule(id, input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(schedule, {
                    message: 'Schedule updated successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    deleteSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            await this.service.deleteSchedule(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createEmptyResponse('Schedule deleted successfully', req.requestId as string)
            );
        } catch (error) {
            next(error);
        }
    };
}

export const schedulesController = new SchedulesController();
