import { SerializedError } from '../errors';

export interface ApiErrorMeta {
  requestId?: string;
  timestamp: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, unknown>;
  };
  meta?: ApiErrorMeta;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

export interface ApiValidationErrorResponse extends ApiErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    statusCode: 400;
    details: {
      errors: ValidationErrorDetail[];
    };
  };
}

export function createApiErrorResponse(
  error: SerializedError | { code: string; message: string; statusCode: number; details?: Record<string, unknown> },
  options?: {
    meta?: Partial<ApiErrorMeta>;
  }
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      ...(error.details && { details: error.details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...options?.meta,
    },
  };
}

export function createValidationErrorResponse(
  errors: ValidationErrorDetail[],
  message = 'Validation failed',
  requestId?: string
): ApiValidationErrorResponse {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
      statusCode: 400,
      details: { errors },
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    },
  };
}

export function createNotFoundErrorResponse(
  resource: string,
  identifier?: string | number,
  requestId?: string
): ApiErrorResponse {
  return createApiErrorResponse(
    {
      code: 'NOT_FOUND',
      message: identifier
        ? `${resource} with identifier '${identifier}' not found`
        : `${resource} not found`,
      statusCode: 404,
      details: { resource, identifier },
    },
    { meta: { requestId } }
  );
}

export function createUnauthorizedErrorResponse(
  message = 'Unauthorized',
  requestId?: string
): ApiErrorResponse {
  return createApiErrorResponse(
    {
      code: 'UNAUTHORIZED',
      message,
      statusCode: 401,
    },
    { meta: { requestId } }
  );
}

export function createForbiddenErrorResponse(
  message = 'Forbidden',
  requestId?: string
): ApiErrorResponse {
  return createApiErrorResponse(
    {
      code: 'FORBIDDEN',
      message,
      statusCode: 403,
    },
    { meta: { requestId } }
  );
}

export function createInternalErrorResponse(
  requestId?: string,
  message = 'An unexpected error occurred'
): ApiErrorResponse {
  return createApiErrorResponse(
    {
      code: 'INTERNAL_SERVER_ERROR',
      message,
      statusCode: 500,
    },
    { meta: { requestId } }
  );
}
