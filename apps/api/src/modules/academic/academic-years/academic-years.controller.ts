/**
 * Academic Years Controller
 * HTTP request handlers
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse, createEmptyResponse } from '@school-erp/shared';
import { academicYearsService, AcademicYearsService } from './academic-years.service';
import { getRequestContext } from '../../authz';
import type {
    CreateAcademicYearInput,
    UpdateAcademicYearInput,
    ListAcademicYearsQuery,
} from './academic-years.validator';

export class AcademicYearsController {
    constructor(private readonly service: AcademicYearsService = academicYearsService) { }

    createAcademicYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as CreateAcademicYearInput;

            const academicYear = await this.service.createAcademicYear(input, {
                tenantId: context.tenant.id,
                userId: context.user.id,
            });

            res.status(201).json(
                createApiResponse(academicYear, {
                    message: 'Academic year created successfully',
                    meta: { requestId: req.requestId },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getAcademicYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const academicYear = await this.service.getAcademicYearById(id, {
                tenantId: context.tenant.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(academicYear, {
                    meta: { requestId: req.requestId },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    listAcademicYears = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const query = req.query as unknown as ListAcademicYearsQuery;

            const result = await this.service.listAcademicYears(
                {
                    page: query.page,
                    limit: query.limit,
                    sortBy: query.sortBy,
                    sortOrder: query.sortOrder,
                    filters: {
                        status: query.status,
                        isCurrent: query.isCurrent,
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
                    meta: { requestId: req.requestId },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    updateAcademicYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;
            const input = req.body as UpdateAcademicYearInput;

            const academicYear = await this.service.updateAcademicYear(id, input, {
                tenantId: context.tenant.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(academicYear, {
                    message: 'Academic year updated successfully',
                    meta: { requestId: req.requestId },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    deleteAcademicYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            await this.service.deleteAcademicYear(id, {
                tenantId: context.tenant.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createEmptyResponse('Academic year deleted successfully', req.requestId)
            );
        } catch (error) {
            next(error);
        }
    };

    activateAcademicYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const academicYear = await this.service.activateAcademicYear(id, {
                tenantId: context.tenant.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(academicYear, {
                    message: 'Academic year activated successfully',
                    meta: { requestId: req.requestId },
                })
            );
        } catch (error) {
            next(error);
        }
    };
}

export const academicYearsController = new AcademicYearsController();
