import { AppError, ErrorDetails } from './AppError';

export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly code = 'NOT_FOUND';

  constructor(message = 'Resource not found', details?: ErrorDetails) {
    super(message, details);
  }
}

export class ResourceNotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly code = 'RESOURCE_NOT_FOUND';
  public readonly resource: string;

  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, { resource, identifier });
    this.resource = resource;
  }
}
