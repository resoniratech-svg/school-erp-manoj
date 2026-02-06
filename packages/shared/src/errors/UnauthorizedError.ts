import { AppError, ErrorDetails } from './AppError';

export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;
  public readonly code = 'UNAUTHORIZED';

  constructor(message = 'Unauthorized', details?: ErrorDetails) {
    super(message, details);
  }
}

export class InvalidCredentialsError extends AppError {
  public readonly statusCode = 401;
  public readonly code = 'INVALID_CREDENTIALS';

  constructor(message = 'Invalid credentials', details?: ErrorDetails) {
    super(message, details);
  }
}

export class TokenExpiredError extends AppError {
  public readonly statusCode = 401;
  public readonly code = 'TOKEN_EXPIRED';

  constructor(message = 'Token has expired', details?: ErrorDetails) {
    super(message, details);
  }
}

export class InvalidTokenError extends AppError {
  public readonly statusCode = 401;
  public readonly code = 'INVALID_TOKEN';

  constructor(message = 'Invalid token', details?: ErrorDetails) {
    super(message, details);
  }
}
