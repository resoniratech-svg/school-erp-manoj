import { AppError, ErrorDetails } from './AppError';

export class InternalServerError extends AppError {
  public readonly statusCode = 500;
  public readonly code = 'INTERNAL_SERVER_ERROR';
  public readonly isOperational = false;

  constructor(message = 'Internal server error', details?: ErrorDetails) {
    super(message, details);
  }
}

export class DatabaseError extends AppError {
  public readonly statusCode = 500;
  public readonly code = 'DATABASE_ERROR';
  public readonly isOperational = false;

  constructor(message = 'Database error', details?: ErrorDetails) {
    super(message, details);
  }
}

export class ExternalServiceError extends AppError {
  public readonly statusCode = 502;
  public readonly code = 'EXTERNAL_SERVICE_ERROR';

  constructor(serviceName: string, message?: string) {
    super(message || `External service error: ${serviceName}`, { serviceName });
  }
}

export class ServiceUnavailableError extends AppError {
  public readonly statusCode = 503;
  public readonly code = 'SERVICE_UNAVAILABLE';

  constructor(message = 'Service temporarily unavailable', details?: ErrorDetails) {
    super(message, details);
  }
}

export class RateLimitError extends AppError {
  public readonly statusCode = 429;
  public readonly code = 'RATE_LIMIT_EXCEEDED';

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, retryAfter ? { retryAfter } : undefined);
  }
}

export class PayloadTooLargeError extends AppError {
  public readonly statusCode = 413;
  public readonly code = 'PAYLOAD_TOO_LARGE';

  constructor(message = 'Request payload too large', details?: ErrorDetails) {
    super(message, details);
  }
}

export class UnprocessableEntityError extends AppError {
  public readonly statusCode = 422;
  public readonly code = 'UNPROCESSABLE_ENTITY';

  constructor(message = 'Unprocessable entity', details?: ErrorDetails) {
    super(message, details);
  }
}
