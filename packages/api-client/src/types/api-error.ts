/**
 * API Error Type
 * Unified error shape for all API errors
 */

export interface ApiError {
    code: string;
    message: string;
    statusCode: number;
    requestId?: string;
    details?: unknown;
}

/**
 * Known error codes from backend
 */
export const ERROR_CODES = {
    // Auth errors
    AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
    AUTH_REFRESH_FAILED: 'AUTH_REFRESH_FAILED',
    AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

    // RBAC errors
    FORBIDDEN: 'FORBIDDEN',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    BAD_REQUEST: 'BAD_REQUEST',

    // Rate limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

    // Not found
    NOT_FOUND: 'NOT_FOUND',

    // Server errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

    // Network errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error &&
        'statusCode' in error
    );
}
