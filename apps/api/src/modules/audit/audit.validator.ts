/**
 * Audit Module Validators
 * READ-ONLY - only query validation
 */
import { z } from 'zod';
import { AUDIT_ACTION, AUDIT_MODULE, PAGINATION } from './audit.constants';

// List Audit Logs Query
export const listAuditLogsSchema = z.object({
    query: z.object({
        module: z.enum(Object.values(AUDIT_MODULE) as [string, ...string[]]).optional(),
        entity: z.string().max(100).optional(),
        action: z.enum(Object.values(AUDIT_ACTION) as [string, ...string[]]).optional(),
        userId: z.string().uuid().optional(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).pipe(
            z.number().min(1).max(PAGINATION.MAX_LIMIT)
        ).optional(),
    }).refine(
        (data) => {
            if (data.startDate && data.endDate) {
                return new Date(data.startDate) <= new Date(data.endDate);
            }
            return true;
        },
        { message: 'startDate must be before or equal to endDate' }
    ),
});

// Get single log by ID
export const auditLogIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

// Type exports
export type AuditFilterInput = z.infer<typeof listAuditLogsSchema>['query'];
