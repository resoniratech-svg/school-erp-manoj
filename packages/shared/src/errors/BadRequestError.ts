import { AppError, ErrorDetails } from './AppError';

export class BadRequestError extends AppError {
  public readonly statusCode = 400;
  public readonly code = 'BAD_REQUEST';

  constructor(message = 'Bad Request', details?: ErrorDetails) {
    super(message, details);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 400;
  public readonly code = 'VALIDATION_ERROR';

  constructor(message = 'Validation failed', details?: ErrorDetails) {
    super(message, details);
  }
}
