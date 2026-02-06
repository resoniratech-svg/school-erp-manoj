/**
 * Error Handler
 * Normalizes backend errors to unified ApiError shape
 */
import type { AxiosError } from 'axios';
import { ApiError, ERROR_CODES } from '../types/api-error';

interface BackendError {
    code?: string;
    message?: string;
    error?: string;
    details?: unknown;
}

/**
 * Normalize any error to ApiError
 */
export function normalizeError(error: unknown): ApiError {
    // Axios error
    if (isAxiosError(error)) {
        return handleAxiosError(error);
    }

    // Already an ApiError
    if (isApiError(error)) {
        return error;
    }

    // Native Error
    if (error instanceof Error) {
        return {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message,
            statusCode: 500,
        };
    }

    // Unknown
    return {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        statusCode: 500,
    };
}

/**
 * Handle Axios error
 */
function handleAxiosError(error: AxiosError<BackendError>): ApiError {
    const requestId = error.response?.headers?.['x-request-id'] as string | undefined;

    // Network error (no response)
    if (!error.response) {
        if (error.code === 'ECONNABORTED') {
            return {
                code: ERROR_CODES.TIMEOUT,
                message: 'Request timed out',
                statusCode: 408,
                requestId,
            };
        }
        return {
            code: ERROR_CODES.NETWORK_ERROR,
            message: 'Network error. Please check your connection.',
            statusCode: 0,
            requestId,
        };
    }

    const { status, data } = error.response;

    // Rate limit error
    if (status === 429) {
        return {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: data?.message || 'Rate limit exceeded. Please try again later.',
            statusCode: 429,
            requestId,
            details: data?.details,
        };
    }

    // Auth errors
    if (status === 401) {
        const code = data?.code || ERROR_CODES.AUTH_UNAUTHORIZED;
        return {
            code,
            message: data?.message || 'Authentication required',
            statusCode: 401,
            requestId,
        };
    }

    // RBAC errors
    if (status === 403) {
        return {
            code: ERROR_CODES.FORBIDDEN,
            message: data?.message || 'Access denied',
            statusCode: 403,
            requestId,
        };
    }

    // Not found
    if (status === 404) {
        return {
            code: ERROR_CODES.NOT_FOUND,
            message: data?.message || 'Resource not found',
            statusCode: 404,
            requestId,
        };
    }

    // Validation errors
    if (status === 400) {
        return {
            code: data?.code || ERROR_CODES.BAD_REQUEST,
            message: data?.message || 'Invalid request',
            statusCode: 400,
            requestId,
            details: data?.details,
        };
    }

    // Server errors
    if (status >= 500) {
        return {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: data?.message || 'Server error. Please try again later.',
            statusCode: status,
            requestId,
        };
    }

    // Default
    return {
        code: data?.code || ERROR_CODES.INTERNAL_ERROR,
        message: data?.message || error.message || 'An error occurred',
        statusCode: status,
        requestId,
        details: data?.details,
    };
}

/**
 * Type guard for Axios error
 */
function isAxiosError(error: unknown): error is AxiosError<BackendError> {
    return (
        typeof error === 'object' &&
        error !== null &&
        'isAxiosError' in error &&
        (error as AxiosError).isAxiosError === true
    );
}

/**
 * Type guard for ApiError
 */
function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error &&
        'statusCode' in error
    );
}
