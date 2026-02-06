/**
 * Subscription Module Validators
 */
import { z } from 'zod';
import { PLAN_CODES } from './subscription.constants';

export const changePlanSchema = z.object({
    planCode: z.enum([
        PLAN_CODES.FREE,
        PLAN_CODES.BASIC,
        PLAN_CODES.PRO,
        PLAN_CODES.ENTERPRISE,
    ]),
});

export type ChangePlanBody = z.infer<typeof changePlanSchema>;
