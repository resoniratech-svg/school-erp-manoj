/**
 * Attendance Zod Validators
 */
import { z } from 'zod';
import { ATTENDANCE_STATUS_OPTIONS } from './attendance.constants';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const bulkAttendanceEntrySchema = z.object({
    studentId: z.string().uuid('Invalid student ID'),
    status: z.enum(ATTENDANCE_STATUS_OPTIONS),
    remarks: z.string().max(500).optional(),
});

export const bulkMarkAttendanceSchema = z.object({
    body: z.object({
        sectionId: z.string().uuid('Invalid section ID'),
        academicYearId: z.string().uuid('Invalid academic year ID'),
        date: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'),
        entries: z.array(bulkAttendanceEntrySchema).min(1, 'At least one entry required'),
        allowCorrection: z.boolean().optional().default(false),
    }).strict(),
});

export const updateAttendanceSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid attendance ID'),
    }),
    body: z.object({
        status: z.enum(ATTENDANCE_STATUS_OPTIONS).optional(),
        remarks: z.string().max(500).nullable().optional(),
    }).strict(),
});

export const attendanceIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid attendance ID'),
    }),
});

export const listAttendanceSchema = z.object({
    query: z.object({
        sectionId: z.string().uuid().optional(),
        date: z.string().regex(dateRegex).optional(),
        studentId: z.string().uuid().optional(),
        academicYearId: z.string().uuid().optional(),
    }),
});

export const sectionDateParamsSchema = z.object({
    params: z.object({
        sectionId: z.string().uuid('Invalid section ID'),
        date: z.string().regex(dateRegex, 'Invalid date format'),
    }),
});

export const studentSummaryParamsSchema = z.object({
    params: z.object({
        studentId: z.string().uuid('Invalid student ID'),
    }),
    query: z.object({
        academicYearId: z.string().uuid().optional(),
    }),
});

export type BulkMarkAttendanceInput = z.infer<typeof bulkMarkAttendanceSchema>['body'];
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>['body'];
