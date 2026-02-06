import { PaginationMeta, CursorPaginationMeta } from '../pagination';

export interface ApiResponseMeta {
  requestId?: string;
  timestamp: string;
  pagination?: PaginationMeta | CursorPaginationMeta;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: ApiResponseMeta;
}

export interface ApiListResponse<T = unknown> {
  success: true;
  data: T[];
  message?: string;
  meta: ApiResponseMeta & {
    pagination: PaginationMeta | CursorPaginationMeta;
  };
}

export function createApiResponse<T>(
  data: T,
  options?: {
    message?: string;
    meta?: Partial<ApiResponseMeta>;
  }
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(options?.message && { message: options.message }),
    meta: {
      timestamp: new Date().toISOString(),
      ...options?.meta,
    },
  };
}

export function createApiListResponse<T>(
  data: T[],
  pagination: PaginationMeta | CursorPaginationMeta,
  options?: {
    message?: string;
    meta?: Partial<Omit<ApiResponseMeta, 'pagination'>>;
  }
): ApiListResponse<T> {
  return {
    success: true,
    data,
    ...(options?.message && { message: options.message }),
    meta: {
      timestamp: new Date().toISOString(),
      pagination,
      ...options?.meta,
    },
  };
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): ApiResponse<T> {
  return createApiResponse(data, {
    message,
    meta: { requestId },
  });
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  requestId?: string
): ApiListResponse<T> {
  return createApiListResponse(data, pagination, {
    meta: { requestId },
  });
}

export function createEmptyResponse(
  message = 'Operation completed successfully',
  requestId?: string
): ApiResponse<null> {
  return createApiResponse(null, {
    message,
    meta: { requestId },
  });
}
