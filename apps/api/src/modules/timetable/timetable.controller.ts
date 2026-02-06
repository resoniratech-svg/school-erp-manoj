/**
 * Timetable Controller
 * HTTP request handlers
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse, createEmptyResponse } from '@school-erp/shared';
import { timetableService, TimetableService } from './timetable.service';
import { getRequestContext } from '../authz';
import type {
    CreateTimetableInput,
    CreateTimetableEntryInput,
    UpdateTimetableInput,
} from './timetable.validator';

export class TimetableController {
    constructor(private readonly service: TimetableService = timetableService) { }

    createTimetable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as CreateTimetableInput;

            const timetable = await this.service.createTimetable(input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(201).json(
                createApiResponse(timetable, {
                    message: 'Timetable created successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getTimetable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const timetable = await this.service.getTimetableById(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(timetable, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    listTimetables = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { branchId, academicYearId, classId, isActive } = req.query;

            const timetables = await this.service.listTimetables(
                {
                    academicYearId: academicYearId as string,
                    classId: classId as string,
                    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
                },
                {
                    tenantId: context.tenant.id,
                    branchId: (branchId as string) || context.branch?.id || '',
                    userId: context.user.id,
                }
            );

            res.status(200).json(
                createApiResponse({ timetables }, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    updateTimetable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;
            const input = req.body as UpdateTimetableInput;

            const timetable = await this.service.updateTimetable(id, input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(timetable, {
                    message: 'Timetable updated successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    deleteTimetable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            await this.service.deleteTimetable(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createEmptyResponse('Timetable deleted successfully', req.requestId as string)
            );
        } catch (error) {
            next(error);
        }
    };

    addEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;
            const input = req.body as CreateTimetableEntryInput;

            const entry = await this.service.addEntry(id, input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(201).json(
                createApiResponse(entry, {
                    message: 'Entry added successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    removeEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id, entryId } = req.params;

            await this.service.removeEntry(id, entryId, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createEmptyResponse('Entry removed successfully', req.requestId as string)
            );
        } catch (error) {
            next(error);
        }
    };

    getClassTimetable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { classId } = req.params;
            const { sectionId } = req.query;

            const timetables = await this.service.getClassTimetable(
                classId,
                sectionId as string | undefined,
                {
                    tenantId: context.tenant.id,
                    branchId: context.branch?.id || '',
                    userId: context.user.id,
                }
            );

            res.status(200).json(
                createApiResponse({ timetables }, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getTeacherTimetable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { teacherId } = req.params;

            const entries = await this.service.getTeacherTimetable(teacherId, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse({ entries }, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    validateTimetable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { timetableId, entries } = req.body;

            const result = await this.service.validateEntries(timetableId, entries, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
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
}

export const timetableController = new TimetableController();
