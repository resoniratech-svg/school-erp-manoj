/**
 * Timetable Zod Validators
 */
import { z } from 'zod';
import { DAYS_OF_WEEK } from './timetable.constants';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createTimetableSchema = z.object({
    body: z.object({
        academicYearId: z.string().uuid('Invalid academic year ID'),
        classId: z.string().uuid('Invalid class ID'),
        sectionId: z.string().uuid('Invalid section ID'),
        effectiveFrom: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)'),
        effectiveTo: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)').optional(),
    }).strict(),
});

export const createTimetableEntrySchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid timetable ID'),
    }),
    body: z.object({
        dayOfWeek: z.enum(DAYS_OF_WEEK),
        periodId: z.string().uuid('Invalid period ID'),
        subjectId: z.string().uuid('Invalid subject ID'),
        teacherId: z.string().uuid('Invalid teacher ID'),
    }).strict(),
});

export const updateTimetableSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid timetable ID'),
    }),
    body: z.object({
        effectiveFrom: z.string().regex(dateRegex, 'Invalid date format').optional(),
        effectiveTo: z.string().regex(dateRegex, 'Invalid date format').nullable().optional(),
        isActive: z.boolean().optional(),
    }).strict(),
});

export const timetableIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid timetable ID'),
    }),
});

export const listTimetablesSchema = z.object({
    query: z.object({
        branchId: z.string().uuid('Branch ID is required'),
        academicYearId: z.string().uuid().optional(),
        classId: z.string().uuid().optional(),
        isActive: z.coerce.boolean().optional(),
    }),
});

export const classTimetableSchema = z.object({
    params: z.object({
        classId: z.string().uuid('Invalid class ID'),
    }),
    query: z.object({
        sectionId: z.string().uuid().optional(),
    }),
});

export const teacherTimetableSchema = z.object({
    params: z.object({
        teacherId: z.string().uuid('Invalid teacher ID'),
    }),
});

export const validateTimetableSchema = z.object({
    body: z.object({
        timetableId: z.string().uuid('Invalid timetable ID'),
        entries: z.array(z.object({
            dayOfWeek: z.enum(DAYS_OF_WEEK),
            periodId: z.string().uuid(),
            subjectId: z.string().uuid(),
            teacherId: z.string().uuid(),
        })),
    }),
});

export const entryIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid timetable ID'),
        entryId: z.string().uuid('Invalid entry ID'),
    }),
});

export type CreateTimetableInput = z.infer<typeof createTimetableSchema>['body'];
export type CreateTimetableEntryInput = z.infer<typeof createTimetableEntrySchema>['body'];
export type UpdateTimetableInput = z.infer<typeof updateTimetableSchema>['body'];
