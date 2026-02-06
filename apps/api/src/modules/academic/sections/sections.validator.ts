/**
 * Sections Zod Validators
 */
import { z } from 'zod';
import { PAGINATION_DEFAULTS } from './sections.constants';

export const createSectionSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required').max(50),
        code: z.string().min(1, 'Code is required').max(10),
        capacity: z.number().int().min(1).optional(),
        room: z.string().max(50).optional(),
        classId: z.string().uuid('Invalid class ID'),
        classTeacherId: z.string().uuid('Invalid staff ID').optional(),
    }).strict(),
});

export const updateSectionSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid section ID'),
    }),
    body: z.object({
        name: z.string().min(1).max(50).optional(),
        code: z.string().min(1).max(10).optional(),
        capacity: z.number().int().min(1).nullable().optional(),
        room: z.string().max(50).nullable().optional(),
    }).strict(),
});

export const assignClassTeacherSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid section ID'),
    }),
    body: z.object({
        classTeacherId: z.string().uuid('Invalid staff ID').nullable(),
    }).strict(),
});

export const sectionIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid section ID'),
    }),
});

export const listSectionsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.PAGE),
        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(PAGINATION_DEFAULTS.MAX_LIMIT)
            .default(PAGINATION_DEFAULTS.LIMIT),
        sortBy: z.enum(['createdAt', 'name', 'code']).default('name'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
        classId: z.string().uuid('Class ID is required'),
        search: z.string().max(100).optional(),
    }),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>['body'];
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>['body'];
export type AssignClassTeacherInput = z.infer<typeof assignClassTeacherSchema>['body'];
export type ListSectionsQuery = z.infer<typeof listSectionsSchema>['query'];
