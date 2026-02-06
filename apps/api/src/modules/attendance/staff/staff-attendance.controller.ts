/**
 * Staff Attendance Controller
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@school-erp/shared';
import { staffAttendanceService, StaffAttendanceService } from './staff-attendance.service';
import { getRequestContext } from '../../authz';
import type { MarkStaffAttendanceInput, UpdateStaffAttendanceInput } from './staff-attendance.validator';

export class StaffAttendanceController {
    constructor(private readonly service: StaffAttendanceService = staffAttendanceService) { }

    markAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as MarkStaffAttendanceInput;

            const record = await this.service.markAttendance(input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(201).json(
                createApiResponse(record, {
                    message: 'Staff attendance marked successfully',
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
            const { staffId, date } = req.query;

            const records = await this.service.listAttendance(
                { staffId: staffId as string, date: date as string },
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
            const input = req.body as UpdateStaffAttendanceInput;

            const record = await this.service.updateAttendance(id, input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(record, {
                    message: 'Staff attendance updated successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };
}

export const staffAttendanceController = new StaffAttendanceController();
