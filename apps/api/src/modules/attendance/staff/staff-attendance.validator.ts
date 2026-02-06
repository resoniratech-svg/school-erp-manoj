/**
 * Staff Attendance Validators
 */
import { z } from 'zod';
import { STAFF_ATTENDANCE_STATUS_OPTIONS } from './staff-attendance.constants';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const markStaffAttendanceSchema = z.object({
    body: z.object({
        staffId: z.string().uuid('Invalid staff ID'),
        date: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'),
        status: z.enum(STAFF_ATTENDANCE_STATUS_OPTIONS),
        checkInTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
        checkOutTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
        remarks: z.string().max(500).optional(),
    }).strict(),
});

export const updateStaffAttendanceSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid attendance ID'),
    }),
    body: z.object({
        status: z.enum(STAFF_ATTENDANCE_STATUS_OPTIONS).optional(),
        checkInTime: z.string().regex(timeRegex).nullable().optional(),
        checkOutTime: z.string().regex(timeRegex).nullable().optional(),
        remarks: z.string().max(500).nullable().optional(),
    }).strict(),
});

export const staffAttendanceIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid attendance ID'),
    }),
});

export const listStaffAttendanceSchema = z.object({
    query: z.object({
        staffId: z.string().uuid().optional(),
        date: z.string().regex(dateRegex).optional(),
        branchId: z.string().uuid().optional(),
    }),
});

export type MarkStaffAttendanceInput = z.infer<typeof markStaffAttendanceSchema>['body'];
export type UpdateStaffAttendanceInput = z.infer<typeof updateStaffAttendanceSchema>['body'];
