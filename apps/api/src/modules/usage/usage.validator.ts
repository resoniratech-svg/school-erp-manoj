/**
 * Usage Metering Validators
 */
import { z } from 'zod';
import { USAGE_METRICS } from './usage.constants';

export const usageMetricSchema = z.enum([
    USAGE_METRICS.STUDENTS,
    USAGE_METRICS.STAFF,
    USAGE_METRICS.BRANCHES,
    USAGE_METRICS.STORAGE_MB,
    USAGE_METRICS.NOTIFICATIONS,
]);

export type UsageMetricInput = z.infer<typeof usageMetricSchema>;
