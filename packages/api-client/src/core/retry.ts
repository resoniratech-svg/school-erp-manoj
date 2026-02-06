/**
 * Retry Logic
 * Safe retries for idempotent requests only
 */
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

interface RetryConfig extends InternalAxiosRequestConfig {
    _retryCount?: number;
}

/**
 * Check if request should be retried
 */
export function shouldRetry(error: AxiosError, config: RetryConfig): boolean {
    // Only retry safe methods
    const method = config.method?.toUpperCase() || '';
    if (!SAFE_METHODS.includes(method)) {
        return false;
    }

    // Check retry count
    const retryCount = config._retryCount || 0;
    if (retryCount >= MAX_RETRIES) {
        return false;
    }

    // Only retry on network errors or 5xx
    if (!error.response) {
        return true; // Network error
    }

    const status = error.response.status;
    return status >= 500 && status !== 501;
}

/**
 * Get retry delay with exponential backoff
 */
export function getRetryDelay(retryCount: number): number {
    return BASE_DELAY_MS * Math.pow(2, retryCount);
}

/**
 * Increment retry count on config
 */
export function incrementRetryCount(config: RetryConfig): RetryConfig {
    return {
        ...config,
        _retryCount: (config._retryCount || 0) + 1,
    };
}

/**
 * Sleep for delay
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
