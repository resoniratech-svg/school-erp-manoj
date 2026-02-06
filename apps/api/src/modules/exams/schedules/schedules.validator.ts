/**
 * Exam Schedules Validators
 */
import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createScheduleSchema = z.object({
    body: z.object({
        examId: z.string().uuid('Invalid exam ID'),
        classId: z.string().uuid('Invalid class ID'),
        subjectId: z.string().uuid('Invalid subject ID'),
        date: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'),
        startTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
        endTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
        maxMarks: z.number().int().min(1).max(1000),
        passingMarks: z.number().int().min(0),
    }).strict().refine(
        (data) => data.startTime < data.endTime,
        { message: 'End time must be after start time', path: ['endTime'] }
    ).refine(
        (data) => data.passingMarks <= data.maxMarks,
        { message: 'Passing marks cannot exceed max marks', path: ['passingMarks'] }
    ),
});

export const updateScheduleSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid schedule ID'),
    }),
    body: z.object({
        date: z.string().regex(dateRegex).optional(),
        startTime: z.string().regex(timeRegex).optional(),
        endTime: z.string().regex(timeRegex).optional(),
        maxMarks: z.number().int().min(1).max(1000).optional(),
        passingMarks: z.number().int().min(0).optional(),
    }).strict(),
});

export const scheduleIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid schedule ID'),
    }),
});

export const listSchedulesSchema = z.object({
    query: z.object({
        examId: z.string().uuid().optional(),
        classId: z.string().uuid().optional(),
    }),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>['body'];
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>['body'];
