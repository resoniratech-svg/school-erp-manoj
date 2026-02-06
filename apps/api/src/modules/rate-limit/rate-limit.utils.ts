/**
 * Rate Limit Utilities
 * Key builders and helpers
 */
import { REDIS_KEY_PREFIX, RATE_LIMIT_SCOPE } from './rate-limit.constants';
import type { RateLimitScope } from './rate-limit.types';

/**
 * Get current window identifier (minute-based)
 */
export function getCurrentWindow(windowSeconds: number): string {
    const now = Math.floor(Date.now() / 1000);
    const window = Math.floor(now / windowSeconds) * windowSeconds;
    return window.toString();
}

/**
 * Build Redis key for rate limiting
 * Format: rate:{scope}:{id}:{window}
 */
export function buildRateLimitKey(
    scope: RateLimitScope,
    identifier: string,
    windowSeconds: number
): string {
    const window = getCurrentWindow(windowSeconds);
    return `${REDIS_KEY_PREFIX}:${scope}:${identifier}:${window}`;
}

/**
 * Calculate reset timestamp
 */
export function calculateResetTimestamp(windowSeconds: number): number {
    const now = Math.floor(Date.now() / 1000);
    const currentWindow = Math.floor(now / windowSeconds) * windowSeconds;
    return currentWindow + windowSeconds;
}

/**
 * Extract client IP from request
 */
export function extractClientIp(req: {
    ip?: string;
    headers: Record<string, string | string[] | undefined>;
}): string {
    // Check X-Forwarded-For header first (for proxied requests)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        const ip = Array.isArray(forwardedFor)
            ? forwardedFor[0]
            : forwardedFor.split(',')[0].trim();
        return ip;
    }

    // Check X-Real-IP header
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
        return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // Fall back to req.ip
    return req.ip || 'unknown';
}

/**
 * Sanitize identifier for Redis key
 */
export function sanitizeIdentifier(id: string): string {
    return id.replace(/[^a-zA-Z0-9-_.]/g, '_');
}

/**
 * Check if path is an auth endpoint (for stricter limits)
 */
export function isAuthEndpoint(path: string): boolean {
    const authPaths = [
        '/auth/login',
        '/auth/register',
        '/auth/password/forgot',
        '/auth/password/reset',
        '/auth/verify',
    ];
    return authPaths.some(p => path.startsWith(`/api/v1${p}`) || path.startsWith(p));
}

/**
 * Check if path should skip rate limiting
 */
export function shouldSkipRateLimit(path: string): boolean {
    const skipPaths = [
        '/health',
        '/api/v1/health',
    ];
    return skipPaths.some(p => path.startsWith(p));
}
