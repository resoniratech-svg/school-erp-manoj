import { AppError, ErrorDetails } from './AppError';

export class ConflictError extends AppError {
  public readonly statusCode = 409;
  public readonly code = 'CONFLICT';

  constructor(message = 'Resource conflict', details?: ErrorDetails) {
    super(message, details);
  }
}

export class DuplicateResourceError extends AppError {
  public readonly statusCode = 409;
  public readonly code = 'DUPLICATE_RESOURCE';

  constructor(resource: string, field?: string, value?: unknown) {
    const message = field
      ? `${resource} with ${field} '${value}' already exists`
      : `${resource} already exists`;
    super(message, { resource, field, value });
  }
}

export class ResourceInUseError extends AppError {
  public readonly statusCode = 409;
  public readonly code = 'RESOURCE_IN_USE';

  constructor(message = 'Resource is currently in use', details?: ErrorDetails) {
    super(message, details);
  }
}
