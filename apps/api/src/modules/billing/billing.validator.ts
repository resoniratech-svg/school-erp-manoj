/**
 * Billing Module Validators
 */
import { z } from 'zod';

export const createOrderSchema = z.object({
    planCode: z.string().min(1, 'Plan code required'),
});

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
