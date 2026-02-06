/**
 * Reports Controller
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@school-erp/shared';
import { reportsService, ReportsService } from './reports.service';
import { getRequestContext } from '../authz';
import type { GenerateReportCardInput } from './reports.validator';

export class ReportsController {
    constructor(private readonly service: ReportsService = reportsService) { }

    generateReportCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as GenerateReportCardInput;

            const reportCard = await this.service.generateReportCard(input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(201).json(
                createApiResponse(reportCard, {
                    message: 'Report card generated successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getReportCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const reportCard = await this.service.getReportCardById(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(reportCard, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    listReportCards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { studentId, examId, academicYearId, classId } = req.query;

            const reportCards = await this.service.listReportCards(
                {
                    studentId: studentId as string,
                    examId: examId as string,
                    academicYearId: academicYearId as string,
                    classId: classId as string,
                },
                {
                    tenantId: context.tenant.id,
                    branchId: context.branch?.id || '',
                    userId: context.user.id,
                }
            );

            res.status(200).json(
                createApiResponse({ reportCards }, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    publishReportCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;
            const { remarks } = req.body;

            const reportCard = await this.service.publishReportCard(id, remarks, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(reportCard, {
                    message: 'Report card published successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    checkPromotionEligibility = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { studentId } = req.params;
            const { academicYearId } = req.query;

            const eligibility = await this.service.checkPromotionEligibility(
                studentId,
                academicYearId as string,
                {
                    tenantId: context.tenant.id,
                    branchId: context.branch?.id || '',
                    userId: context.user.id,
                }
            );

            res.status(200).json(
                createApiResponse(eligibility, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };
}

export const reportsController = new ReportsController();
