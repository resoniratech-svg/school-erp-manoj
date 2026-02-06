/**
 * Rate Limiting Constants
 * Headers, defaults, error codes
 */

// Rate Limit Scopes
export const RATE_LIMIT_SCOPE = {
    TENANT: 'tenant',
    USER: 'user',
    IP: 'ip',
} as const;

// HTTP Headers
export const RATE_LIMIT_HEADERS = {
    LIMIT: 'X-RateLimit-Limit',
    REMAINING: 'X-RateLimit-Remaining',
    RESET: 'X-RateLimit-Reset',
    RETRY_AFTER: 'Retry-After',
} as const;

// Default Limits (used when config unavailable)
export const DEFAULT_LIMITS = {
    TENANT_PER_MINUTE: 1000,
    USER_PER_MINUTE: 100,
    IP_PER_MINUTE: 60,
    AUTH_LOGIN_PER_MINUTE: 5,
    AUTH_PASSWORD_RESET_PER_HOUR: 3,
    BLOCK_DURATION_SECONDS: 60,
} as const;

// Window Sizes (in seconds)
export const WINDOW_SIZE = {
    MINUTE: 60,
    HOUR: 3600,
} as const;

// Redis Key Prefix
export const REDIS_KEY_PREFIX = 'rate';

// TTL Buffer (seconds)
export const TTL_BUFFER_SECONDS = 5;

// Error Codes
export const RATE_LIMIT_ERROR_CODES = {
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    REDIS_ERROR: 'RATE_LIMIT_REDIS_ERROR',
} as const;

// Permission for status endpoint
export const RATE_LIMIT_PERMISSIONS = {
    READ_STATUS: 'system:read:tenant',
} as const;
