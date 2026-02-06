/**
 * Report Cards Controller
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@school-erp/shared';
import { reportCardsService, ReportCardsService } from './report-cards.service';
import { reportsController } from '../reports.controller';
import { getRequestContext } from '../../authz';
import type { BulkGenerateInput } from '../reports.validator';

export class ReportCardsController {
    constructor(private readonly service: ReportCardsService = reportCardsService) { }

    // Delegate single generation
    generate = reportsController.generateReportCard;

    // Delegate get
    get = reportsController.getReportCard;

    // Delegate list
    list = reportsController.listReportCards;

    // Delegate publish
    publish = reportsController.publishReportCard;

    // Bulk generate
    bulkGenerate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as BulkGenerateInput;

            const result = await this.service.bulkGenerate(input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(result, {
                    message: `Generated ${result.generated} report cards`,
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };
}

export const reportCardsController = new ReportCardsController();
