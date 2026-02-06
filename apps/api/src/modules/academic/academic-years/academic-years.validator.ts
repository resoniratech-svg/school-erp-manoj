/**
 * Academic Years Zod Validators
 */
import { z } from 'zod';
import { ACADEMIC_YEAR_STATUS_OPTIONS, PAGINATION_DEFAULTS } from './academic-years.constants';

export const createAcademicYearSchema = z.object({
    body: z
        .object({
            name: z.string().min(1, 'Name is required').max(50),
            startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
                message: 'Invalid start date format',
            }),
            endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
                message: 'Invalid end date format',
            }),
            status: z.enum(ACADEMIC_YEAR_STATUS_OPTIONS).optional().default('draft'),
        })
        .strict()
        .refine(
            (data) => new Date(data.endDate) > new Date(data.startDate),
            {
                message: 'End date must be after start date',
                path: ['endDate'],
            }
        ),
});

export const updateAcademicYearSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid academic year ID'),
    }),
    body: z
        .object({
            name: z.string().min(1).max(50).optional(),
            startDate: z
                .string()
                .refine((val) => !isNaN(Date.parse(val)), {
                    message: 'Invalid start date format',
                })
                .optional(),
            endDate: z
                .string()
                .refine((val) => !isNaN(Date.parse(val)), {
                    message: 'Invalid end date format',
                })
                .optional(),
            status: z.enum(ACADEMIC_YEAR_STATUS_OPTIONS).optional(),
        })
        .strict(),
});

export const academicYearIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid academic year ID'),
    }),
});

export const listAcademicYearsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.PAGE),
        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(PAGINATION_DEFAULTS.MAX_LIMIT)
            .default(PAGINATION_DEFAULTS.LIMIT),
        sortBy: z.enum(['createdAt', 'name', 'startDate', 'status']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        status: z.enum(ACADEMIC_YEAR_STATUS_OPTIONS).optional(),
        isCurrent: z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        search: z.string().max(100).optional(),
    }),
});

export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>['body'];
export type UpdateAcademicYearInput = z.infer<typeof updateAcademicYearSchema>['body'];
export type ListAcademicYearsQuery = z.infer<typeof listAcademicYearsSchema>['query'];
