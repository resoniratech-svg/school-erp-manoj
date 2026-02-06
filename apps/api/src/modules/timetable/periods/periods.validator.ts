/**
 * Periods Zod Validators
 */
import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createPeriodSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required').max(50),
        startTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
        endTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
        displayOrder: z.number().int().min(1),
        periodType: z.enum(['regular', 'break', 'lunch', 'assembly']).optional().default('regular'),
    }).strict().refine(
        (data) => data.startTime < data.endTime,
        { message: 'End time must be after start time', path: ['endTime'] }
    ),
});

export const updatePeriodSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid period ID'),
    }),
    body: z.object({
        name: z.string().min(1).max(50).optional(),
        startTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
        endTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
        displayOrder: z.number().int().min(1).optional(),
        periodType: z.enum(['regular', 'break', 'lunch', 'assembly']).optional(),
    }).strict(),
});

export const periodIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid period ID'),
    }),
});

export const listPeriodsSchema = z.object({
    query: z.object({
        branchId: z.string().uuid('Branch ID is required'),
    }),
});

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>['body'];
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>['body'];
