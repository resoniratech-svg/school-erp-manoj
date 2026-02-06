/**
 * Class-Subjects Zod Validators
 */
import { z } from 'zod';

export const assignSubjectSchema = z.object({
    params: z.object({
        classId: z.string().uuid('Invalid class ID'),
    }),
    body: z.object({
        subjectId: z.string().uuid('Invalid subject ID'),
        isMandatory: z.boolean().optional().default(true),
        periodsPerWeek: z.number().int().min(1).optional(),
    }).strict(),
});

export const listClassSubjectsSchema = z.object({
    params: z.object({
        classId: z.string().uuid('Invalid class ID'),
    }),
});

export const removeSubjectSchema = z.object({
    params: z.object({
        classId: z.string().uuid('Invalid class ID'),
        subjectId: z.string().uuid('Invalid subject ID'),
    }),
});

export type AssignSubjectInput = z.infer<typeof assignSubjectSchema>['body'];
