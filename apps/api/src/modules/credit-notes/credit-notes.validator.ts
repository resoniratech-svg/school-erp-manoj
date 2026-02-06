/**
 * Credit Notes Validators
 */
import { z } from 'zod';
import { CREDIT_REASON } from './credit-notes.constants';

export const createCreditNoteSchema = z.object({
    invoiceId: z.string().uuid(),
    reason: z.enum([
        CREDIT_REASON.OVERBILLING,
        CREDIT_REASON.PLAN_DOWNGRADE,
        CREDIT_REASON.REFUND,
        CREDIT_REASON.GST_CORRECTION,
        CREDIT_REASON.CANCELLATION,
    ]),
    amount: z.number().positive(), // paise
    notes: z.string().max(500).optional(),
});

export type CreateCreditNoteBody = z.infer<typeof createCreditNoteSchema>;
