export const AUTHZ_HEADERS = {
  BRANCH_ID: 'x-branch-id',
  TENANT_ID: 'x-tenant-id',
  REQUEST_ID: 'x-request-id',
} as const;

export const CONTEXT_KEYS = {
  REQUEST_CONTEXT: 'requestContext',
  USER: 'user',
  TENANT: 'tenant',
  BRANCH: 'branch',
  PERMISSIONS: 'permissions',
  ROLES: 'roles',
} as const;

export const CACHE_KEYS = {
  TENANT: 'tenant',
  BRANCH: 'branch',
  USER_PERMISSIONS: 'user_permissions',
  USER_ROLES: 'user_roles',
} as const;

export const TENANT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
} as const;

export const BRANCH_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
  PENDING: 'pending',
} as const;

export const PERMISSION_WILDCARD = '*' as const;

export const PERMISSION_SEPARATOR = ':' as const;

export const AUTHZ_ERROR_CODES = {
  UNAUTHORIZED: 'AUTHZ_UNAUTHORIZED',
  FORBIDDEN: 'AUTHZ_FORBIDDEN',
  TENANT_NOT_FOUND: 'AUTHZ_TENANT_NOT_FOUND',
  TENANT_SUSPENDED: 'AUTHZ_TENANT_SUSPENDED',
  BRANCH_NOT_FOUND: 'AUTHZ_BRANCH_NOT_FOUND',
  BRANCH_SUSPENDED: 'AUTHZ_BRANCH_SUSPENDED',
  BRANCH_ACCESS_DENIED: 'AUTHZ_BRANCH_ACCESS_DENIED',
  PERMISSION_DENIED: 'AUTHZ_PERMISSION_DENIED',
  INVALID_TOKEN: 'AUTHZ_INVALID_TOKEN',
  TOKEN_EXPIRED: 'AUTHZ_TOKEN_EXPIRED',
  USER_SUSPENDED: 'AUTHZ_USER_SUSPENDED',
} as const;
