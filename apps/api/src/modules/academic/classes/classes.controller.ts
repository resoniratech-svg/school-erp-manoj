/**
 * Classes Controller
 * HTTP request handlers
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse, createEmptyResponse } from '@school-erp/shared';
import { classesService, ClassesService } from './classes.service';
import { getRequestContext } from '../../authz';
import type {
    CreateClassInput,
    UpdateClassInput,
    ListClassesQuery,
} from './classes.validator';

export class ClassesController {
    constructor(private readonly service: ClassesService = classesService) { }

    createClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as CreateClassInput;

            const classEntity = await this.service.createClass(input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || input.branchId,
                userId: context.user.id,
            });

            res.status(201).json(
                createApiResponse(classEntity, {
                    message: 'Class created successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            // Use branch from context or query param
            const branchId = context.branch?.id || (req.query.branchId as string);

            const classEntity = await this.service.getClassById(id, {
                tenantId: context.tenant.id,
                branchId,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(classEntity, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    listClasses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const query = req.query as unknown as ListClassesQuery;

            const result = await this.service.listClasses(
                {
                    page: query.page,
                    limit: query.limit,
                    sortBy: query.sortBy,
                    sortOrder: query.sortOrder,
                    filters: {
                        branchId: query.branchId,
                        academicYearId: query.academicYearId,
                        search: query.search,
                    },
                },
                {
                    tenantId: context.tenant.id,
                    branchId: query.branchId,
                    userId: context.user.id,
                }
            );

            res.status(200).json(
                createApiResponse(result, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    updateClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;
            const input = req.body as UpdateClassInput;

            // Get branchId from context or we need to fetch the class first
            const branchId = context.branch?.id || (req.query.branchId as string);

            const classEntity = await this.service.updateClass(id, input, {
                tenantId: context.tenant.id,
                branchId,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(classEntity, {
                    message: 'Class updated successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    deleteClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const branchId = context.branch?.id || (req.query.branchId as string);

            await this.service.deleteClass(id, {
                tenantId: context.tenant.id,
                branchId,
                userId: context.user.id,
            });

            res.status(200).json(
                createEmptyResponse('Class deleted successfully', req.requestId as string)
            );
        } catch (error) {
            next(error);
        }
    };
}

export const classesController = new ClassesController();
