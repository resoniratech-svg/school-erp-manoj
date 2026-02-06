/**
 * Sections Controller
 * HTTP request handlers
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse, createEmptyResponse } from '@school-erp/shared';
import { sectionsService, SectionsService } from './sections.service';
import { getRequestContext } from '../../authz';
import type {
    CreateSectionInput,
    UpdateSectionInput,
    AssignClassTeacherInput,
    ListSectionsQuery,
} from './sections.validator';

export class SectionsController {
    constructor(private readonly service: SectionsService = sectionsService) { }

    createSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as CreateSectionInput;

            const section = await this.service.createSection(input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(201).json(
                createApiResponse(section, {
                    message: 'Section created successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const section = await this.service.getSectionById(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(section, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    listSections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const query = req.query as unknown as ListSectionsQuery;

            const result = await this.service.listSections(
                {
                    page: query.page,
                    limit: query.limit,
                    sortBy: query.sortBy,
                    sortOrder: query.sortOrder,
                    filters: {
                        classId: query.classId,
                        search: query.search,
                    },
                },
                {
                    tenantId: context.tenant.id,
                    branchId: context.branch?.id || '',
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

    updateSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;
            const input = req.body as UpdateSectionInput;

            const section = await this.service.updateSection(id, input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(section, {
                    message: 'Section updated successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    assignClassTeacher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;
            const input = req.body as AssignClassTeacherInput;

            const section = await this.service.assignClassTeacher(id, input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(section, {
                    message: 'Class teacher updated successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    deleteSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            await this.service.deleteSection(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createEmptyResponse('Section deleted successfully', req.requestId as string)
            );
        } catch (error) {
            next(error);
        }
    };
}

export const sectionsController = new SectionsController();
