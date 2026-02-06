/**
 * Classes Zod Validators
 */
import { z } from 'zod';
import { PAGINATION_DEFAULTS } from './classes.constants';

export const createClassSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required').max(100),
        code: z.string().min(1, 'Code is required').max(20),
        displayOrder: z.number().int().min(0),
        description: z.string().max(500).optional(),
        branchId: z.string().uuid('Invalid branch ID'),
        academicYearId: z.string().uuid('Invalid academic year ID'),
    }).strict(),
});

export const updateClassSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid class ID'),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        code: z.string().min(1).max(20).optional(),
        displayOrder: z.number().int().min(0).optional(),
        description: z.string().max(500).nullable().optional(),
    }).strict(),
});

export const classIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid class ID'),
    }),
});

export const listClassesSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.PAGE),
        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(PAGINATION_DEFAULTS.MAX_LIMIT)
            .default(PAGINATION_DEFAULTS.LIMIT),
        sortBy: z.enum(['createdAt', 'name', 'code', 'displayOrder']).default('displayOrder'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
        branchId: z.string().uuid('Branch ID is required'),
        academicYearId: z.string().uuid('Academic year ID is required'),
        search: z.string().max(100).optional(),
    }),
});

export type CreateClassInput = z.infer<typeof createClassSchema>['body'];
export type UpdateClassInput = z.infer<typeof updateClassSchema>['body'];
export type ListClassesQuery = z.infer<typeof listClassesSchema>['query'];
