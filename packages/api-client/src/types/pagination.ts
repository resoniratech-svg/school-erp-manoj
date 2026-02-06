/**
 * Pagination Types
 */

/**
 * Pagination query params
 */
export interface PaginationParams {
    page?: number;
    limit?: number;
}

/**
 * Sort params
 */
export interface SortParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Combined query params
 */
export interface QueryParams extends PaginationParams, SortParams {
    search?: string;
    [key: string]: unknown;
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Build query string from params
 */
export function buildQueryParams(params: QueryParams): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
}
