/**
 * Accounting Validators
 */
import { z } from 'zod';
import { EXPORT_FORMAT } from './accounting.constants';

export const dateRangeSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    format: z.enum([
        EXPORT_FORMAT.JSON,
        EXPORT_FORMAT.CSV,
        EXPORT_FORMAT.TALLY,
        EXPORT_FORMAT.ZOHO,
    ]).optional().default(EXPORT_FORMAT.JSON),
});

export type DateRangeQuery = z.infer<typeof dateRangeSchema>;
