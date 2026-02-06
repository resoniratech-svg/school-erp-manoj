/**
 * Attendance Controller
 * HTTP request handlers
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@school-erp/shared';
import { attendanceService, AttendanceService } from './attendance.service';
import { getRequestContext } from '../authz';
import type { BulkMarkAttendanceInput, UpdateAttendanceInput } from './attendance.validator';

export class AttendanceController {
    constructor(private readonly service: AttendanceService = attendanceService) { }

    bulkMarkAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as BulkMarkAttendanceInput;

            const records = await this.service.bulkMarkAttendance(input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(201).json(
                createApiResponse({ records }, {
                    message: `Attendance marked for ${records.length} students`,
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const record = await this.service.getAttendanceById(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(record, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    listAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { sectionId, date, studentId, academicYearId } = req.query;

            const records = await this.service.listAttendance(
                {
                    sectionId: sectionId as string,
                    date: date as string,
                    studentId: studentId as string,
                    academicYearId: academicYearId as string,
                },
                {
                    tenantId: context.tenant.id,
                    branchId: context.branch?.id || '',
                    userId: context.user.id,
                }
            );

            res.status(200).json(
                createApiResponse({ records }, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    updateAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;
            const input = req.body as UpdateAttendanceInput;

            const record = await this.service.updateAttendance(id, input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(record, {
                    message: 'Attendance updated successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getAttendanceBySectionDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { sectionId, date } = req.params;

            const records = await this.service.getAttendanceBySectionDate(sectionId, date, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse({ records }, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    getStudentSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { studentId } = req.params;
            const { academicYearId } = req.query;

            const summary = await this.service.getStudentSummary(
                studentId,
                academicYearId as string | undefined,
                {
                    tenantId: context.tenant.id,
                    branchId: context.branch?.id || '',
                    userId: context.user.id,
                }
            );

            res.status(200).json(
                createApiResponse(summary, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };
}

export const attendanceController = new AttendanceController();
