/**
 * Marks Validators
 */
import { z } from 'zod';

export const bulkMarksEntrySchema = z.object({
    studentId: z.string().uuid('Invalid student ID'),
    marksObtained: z.number().min(0),
    isAbsent: z.boolean().optional().default(false),
    remarks: z.string().max(500).optional(),
});

export const bulkEnterMarksSchema = z.object({
    body: z.object({
        examScheduleId: z.string().uuid('Invalid schedule ID'),
        entries: z.array(bulkMarksEntrySchema).min(1, 'At least one entry required'),
    }).strict(),
});

export const updateMarksSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid marks ID'),
    }),
    body: z.object({
        marksObtained: z.number().min(0).optional(),
        isAbsent: z.boolean().optional(),
        remarks: z.string().max(500).nullable().optional(),
    }).strict(),
});

export const marksIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid marks ID'),
    }),
});

export const listMarksSchema = z.object({
    query: z.object({
        examScheduleId: z.string().uuid().optional(),
        studentId: z.string().uuid().optional(),
        examId: z.string().uuid().optional(),
    }),
});

export const studentResultsSchema = z.object({
    params: z.object({
        examId: z.string().uuid('Invalid exam ID'),
        studentId: z.string().uuid('Invalid student ID'),
    }),
});

export type BulkEnterMarksInput = z.infer<typeof bulkEnterMarksSchema>['body'];
export type UpdateMarksInput = z.infer<typeof updateMarksSchema>['body'];
