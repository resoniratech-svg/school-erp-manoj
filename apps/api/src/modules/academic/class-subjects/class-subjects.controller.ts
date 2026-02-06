/**
 * Class-Subjects Controller
 * HTTP request handlers
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse, createEmptyResponse } from '@school-erp/shared';
import { classSubjectsService, ClassSubjectsService } from './class-subjects.service';
import { getRequestContext } from '../../authz';
import type { AssignSubjectInput } from './class-subjects.validator';

export class ClassSubjectsController {
    constructor(private readonly service: ClassSubjectsService = classSubjectsService) { }

    assignSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { classId } = req.params;
            const input = req.body as AssignSubjectInput;

            const classSubject = await this.service.assignSubject(classId, input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(201).json(
                createApiResponse(classSubject, {
                    message: 'Subject assigned to class successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    listClassSubjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { classId } = req.params;

            const classSubjects = await this.service.listClassSubjects(classId, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse({ subjects: classSubjects }, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    removeSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { classId, subjectId } = req.params;

            await this.service.removeSubject(classId, subjectId, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createEmptyResponse('Subject removed from class successfully', req.requestId as string)
            );
        } catch (error) {
            next(error);
        }
    };
}

export const classSubjectsController = new ClassSubjectsController();
