/**
 * Subjects Controller
 * HTTP request handlers
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse, createEmptyResponse } from '@school-erp/shared';
import { subjectsService, SubjectsService } from './subjects.service';
import { getRequestContext } from '../../authz';
import type {
    CreateSubjectInput,
    UpdateSubjectInput,
    ListSubjectsQuery,
} from './subjects.validator';

export class SubjectsController {
    constructor(private readonly service: SubjectsService = subjectsService) { }

    createSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as CreateSubjectInput;

            const subject = await this.service.createSubject(input, {
                tenantId: context.tenant.id,
                userId: context.user.id,
            });

            res.status(201).json(
                createApiResponse(subject, {
                    message: 'Subject created successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const subject = await this.service.getSubjectById(id, {
                tenantId: context.tenant.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(subject, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    listSubjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const query = req.query as unknown as ListSubjectsQuery;

            const result = await this.service.listSubjects(
                {
                    page: query.page,
                    limit: query.limit,
                    sortBy: query.sortBy,
                    sortOrder: query.sortOrder,
                    filters: {
                        type: query.type,
                        search: query.search,
                    },
                },
                {
                    tenantId: context.tenant.id,
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

    updateSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;
            const input = req.body as UpdateSubjectInput;

            const subject = await this.service.updateSubject(id, input, {
                tenantId: context.tenant.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(subject, {
                    message: 'Subject updated successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    deleteSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            await this.service.deleteSubject(id, {
                tenantId: context.tenant.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createEmptyResponse('Subject deleted successfully', req.requestId as string)
            );
        } catch (error) {
            next(error);
        }
    };
}

export const subjectsController = new SubjectsController();
