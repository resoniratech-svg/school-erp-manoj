import { AppError, ErrorDetails } from './AppError';

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;
  public readonly code = 'FORBIDDEN';

  constructor(message = 'Forbidden', details?: ErrorDetails) {
    super(message, details);
  }
}

export class InsufficientPermissionsError extends AppError {
  public readonly statusCode = 403;
  public readonly code = 'INSUFFICIENT_PERMISSIONS';

  constructor(message = 'Insufficient permissions', details?: ErrorDetails) {
    super(message, details);
  }
}

export class TenantAccessDeniedError extends AppError {
  public readonly statusCode = 403;
  public readonly code = 'TENANT_ACCESS_DENIED';

  constructor(message = 'Access to this tenant is denied', details?: ErrorDetails) {
    super(message, details);
  }
}

export class BranchAccessDeniedError extends AppError {
  public readonly statusCode = 403;
  public readonly code = 'BRANCH_ACCESS_DENIED';

  constructor(message = 'Access to this branch is denied', details?: ErrorDetails) {
    super(message, details);
  }
}
