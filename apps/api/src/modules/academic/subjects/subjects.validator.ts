/**
 * Subjects Zod Validators
 */
import { z } from 'zod';
import { SUBJECT_TYPE_OPTIONS, PAGINATION_DEFAULTS } from './subjects.constants';

export const createSubjectSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required').max(100),
        code: z.string().min(1, 'Code is required').max(20),
        type: z.enum(SUBJECT_TYPE_OPTIONS),
        creditHours: z.number().int().min(1).optional(),
        description: z.string().max(500).optional(),
    }).strict(),
});

export const updateSubjectSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid subject ID'),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        code: z.string().min(1).max(20).optional(),
        type: z.enum(SUBJECT_TYPE_OPTIONS).optional(),
        creditHours: z.number().int().min(1).nullable().optional(),
        description: z.string().max(500).nullable().optional(),
    }).strict(),
});

export const subjectIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid subject ID'),
    }),
});

export const listSubjectsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.PAGE),
        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(PAGINATION_DEFAULTS.MAX_LIMIT)
            .default(PAGINATION_DEFAULTS.LIMIT),
        sortBy: z.enum(['createdAt', 'name', 'code', 'type']).default('name'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
        type: z.enum(SUBJECT_TYPE_OPTIONS).optional(),
        search: z.string().max(100).optional(),
    }),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>['body'];
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>['body'];
export type ListSubjectsQuery = z.infer<typeof listSubjectsSchema>['query'];
