/**
 * API Response Types
 * Standard response shapes from backend
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
    data: T;
    message?: string;
    meta?: {
        requestId?: string;
        timestamp?: string;
        [key: string]: unknown;
    };
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    meta?: {
        requestId?: string;
        [key: string]: unknown;
    };
}

/**
 * List response with pagination
 */
export interface ListResponse<T> {
    items: T[];
    pagination: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * Success response
 */
export interface SuccessResponse {
    success: boolean;
    message?: string;
}

/**
 * Delete response
 */
export interface DeleteResponse {
    deleted: boolean;
    id: string;
}
