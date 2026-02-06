/**
 * Exams Zod Validators
 */
import { z } from 'zod';
import { EXAM_TYPE_OPTIONS, EXAM_STATUS_OPTIONS } from './exams.constants';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createExamSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required').max(100),
        type: z.enum(EXAM_TYPE_OPTIONS),
        academicYearId: z.string().uuid('Invalid academic year ID'),
        startDate: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'),
        endDate: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'),
        description: z.string().max(500).optional(),
    }).strict().refine(
        (data) => data.startDate <= data.endDate,
        { message: 'End date must be on or after start date', path: ['endDate'] }
    ),
});

export const updateExamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid exam ID'),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        type: z.enum(EXAM_TYPE_OPTIONS).optional(),
        startDate: z.string().regex(dateRegex).optional(),
        endDate: z.string().regex(dateRegex).optional(),
        description: z.string().max(500).nullable().optional(),
        status: z.enum(EXAM_STATUS_OPTIONS).optional(),
    }).strict(),
});

export const examIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid exam ID'),
    }),
});

export const listExamsSchema = z.object({
    query: z.object({
        academicYearId: z.string().uuid().optional(),
        type: z.enum(EXAM_TYPE_OPTIONS).optional(),
        status: z.enum(EXAM_STATUS_OPTIONS).optional(),
    }),
});

export const publishExamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid exam ID'),
    }),
});

export type CreateExamInput = z.infer<typeof createExamSchema>['body'];
export type UpdateExamInput = z.infer<typeof updateExamSchema>['body'];
