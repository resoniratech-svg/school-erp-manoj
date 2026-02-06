export { AppError, type ErrorDetails, type SerializedError } from './AppError';

export { BadRequestError, ValidationError } from './BadRequestError';

export {
  UnauthorizedError,
  InvalidCredentialsError,
  TokenExpiredError,
  InvalidTokenError,
} from './UnauthorizedError';

export {
  ForbiddenError,
  InsufficientPermissionsError,
  TenantAccessDeniedError,
  BranchAccessDeniedError,
} from './ForbiddenError';

export { NotFoundError, ResourceNotFoundError } from './NotFoundError';

export {
  ConflictError,
  DuplicateResourceError,
  ResourceInUseError,
} from './ConflictError';

export {
  InternalServerError,
  DatabaseError,
  ExternalServiceError,
  ServiceUnavailableError,
  RateLimitError,
  PayloadTooLargeError,
  UnprocessableEntityError,
} from './ServerErrors';
