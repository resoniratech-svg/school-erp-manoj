/**
 * Transcripts Controller
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@school-erp/shared';
import { transcriptsService, TranscriptsService } from './transcripts.service';
import { getRequestContext } from '../../authz';

export class TranscriptsController {
    constructor(private readonly service: TranscriptsService = transcriptsService) { }

    getTranscript = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { studentId } = req.params;

            const transcript = await this.service.generateTranscript(studentId, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(transcript, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };
}

export const transcriptsController = new TranscriptsController();
