/**
 * Jobs Config Integration
 * Reads from Module 16 (System Config)
 */
import { configService } from '../config';
import { JOB_DEFAULTS } from './jobs.constants';
import type { JobsConfig, JobContext } from './jobs.types';

// Config keys
export const JOBS_CONFIG_KEYS = {
    ENABLED: 'jobs.enabled',
    CONCURRENCY: 'jobs.concurrency',
    MAX_RETRY: 'jobs.maxRetry',
    BACKOFF_SECONDS: 'jobs.backoffSeconds',
} as const;

/**
 * Get resolved jobs config for a tenant
 * Resolution: branchOverride → tenantValue → default
 */
export async function getJobsConfig(context: JobContext): Promise<JobsConfig> {
    try {
        const [enabledConfig, concurrencyConfig, maxRetryConfig, backoffConfig] = await Promise.all([
            configService.getConfigByKey(JOBS_CONFIG_KEYS.ENABLED, context).catch(() => null),
            configService.getConfigByKey(JOBS_CONFIG_KEYS.CONCURRENCY, context).catch(() => null),
            configService.getConfigByKey(JOBS_CONFIG_KEYS.MAX_RETRY, context).catch(() => null),
            configService.getConfigByKey(JOBS_CONFIG_KEYS.BACKOFF_SECONDS, context).catch(() => null),
        ]);

        return {
            enabled: enabledConfig?.value !== false,
            concurrency: (concurrencyConfig?.value as number) ?? JOB_DEFAULTS.CONCURRENCY,
            maxRetry: (maxRetryConfig?.value as number) ?? JOB_DEFAULTS.MAX_RETRY,
            backoffSeconds: (backoffConfig?.value as number) ?? JOB_DEFAULTS.BACKOFF_SECONDS,
        };
    } catch {
        return {
            enabled: true,
            concurrency: JOB_DEFAULTS.CONCURRENCY,
            maxRetry: JOB_DEFAULTS.MAX_RETRY,
            backoffSeconds: JOB_DEFAULTS.BACKOFF_SECONDS,
        };
    }
}

/**
 * Get default config (when config service unavailable)
 */
export function getDefaultJobsConfig(): JobsConfig {
    return {
        enabled: true,
        concurrency: JOB_DEFAULTS.CONCURRENCY,
        maxRetry: JOB_DEFAULTS.MAX_RETRY,
        backoffSeconds: JOB_DEFAULTS.BACKOFF_SECONDS,
    };
}
