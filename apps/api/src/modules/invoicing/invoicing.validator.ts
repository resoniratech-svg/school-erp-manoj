/**
 * Invoicing Validators
 */
import { z } from 'zod';

export const generateInvoiceSchema = z.object({
    billingPeriodStart: z.string().datetime().optional(),
    billingPeriodEnd: z.string().datetime().optional(),
    gstin: z.string().max(20).optional(),
    placeOfSupply: z.string().min(1).max(50),
});

export type GenerateInvoiceBody = z.infer<typeof generateInvoiceSchema>;
