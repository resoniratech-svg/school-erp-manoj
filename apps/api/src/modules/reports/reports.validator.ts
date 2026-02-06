/**
 * Reports Validators
 */
import { z } from 'zod';

export const generateReportCardSchema = z.object({
    body: z.object({
        studentId: z.string().uuid('Invalid student ID'),
        examId: z.string().uuid('Invalid exam ID'),
        academicYearId: z.string().uuid('Invalid academic year ID'),
    }).strict(),
});

export const bulkGenerateReportCardsSchema = z.object({
    body: z.object({
        examId: z.string().uuid('Invalid exam ID'),
        academicYearId: z.string().uuid('Invalid academic year ID'),
        classId: z.string().uuid('Invalid class ID'),
        sectionId: z.string().uuid().optional(),
    }).strict(),
});

export const publishReportCardSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid report card ID'),
    }),
    body: z.object({
        remarks: z.string().max(500).optional(),
    }).strict(),
});

export const reportCardIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid report card ID'),
    }),
});

export const listReportCardsSchema = z.object({
    query: z.object({
        studentId: z.string().uuid().optional(),
        examId: z.string().uuid().optional(),
        academicYearId: z.string().uuid().optional(),
        classId: z.string().uuid().optional(),
    }),
});

export const transcriptParamsSchema = z.object({
    params: z.object({
        studentId: z.string().uuid('Invalid student ID'),
    }),
});

export type GenerateReportCardInput = z.infer<typeof generateReportCardSchema>['body'];
export type BulkGenerateInput = z.infer<typeof bulkGenerateReportCardsSchema>['body'];
