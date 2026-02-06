export {
  AUTHZ_HEADERS,
  CONTEXT_KEYS,
  CACHE_KEYS,
  TENANT_STATUS,
  BRANCH_STATUS,
  USER_STATUS,
  PERMISSION_WILDCARD,
  PERMISSION_SEPARATOR,
  AUTHZ_ERROR_CODES,
} from './authz.constants';

export type {
  AuthzUser,
  AuthzTenant,
  AuthzBranch,
  AuthzRole,
  AuthzUserRole,
  AuthzUserBranch,
  RequestContext,
  PartialRequestContext,
  AuthzMiddleware,
  PermissionGuard,
  PermissionGuardMultiple,
  JwtPayloadExtended,
} from './authz.types';

export {
  createRequestContextBuilder,
  getRequestContext,
  hasRequestContext,
  setRequestContext,
  getUserFromContext,
  getTenantFromContext,
  getBranchFromContext,
  getPermissionsFromContext,
  getRolesFromContext,
  getUserBranchesFromContext,
} from './authz.context';

export {
  authMiddleware,
  fullAuthMiddleware,
  createAuthMiddleware,
  createFullAuthMiddleware,
  extractBearerToken,
  verifyJwtToken,
  findUserById,
  validateUserStatus,
} from './authz.middleware';

export {
  tenantResolver,
  createTenantResolver,
  findTenantById,
  validateTenantStatus,
} from './tenant.resolver';

export {
  branchResolver,
  createBranchResolver,
  findBranchById,
  findUserBranches,
  validateBranchStatus,
  validateUserBranchAccess,
  getPrimaryBranch,
} from './branch.resolver';

export {
  requirePermission,
  requirePermissions,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireBranchAccess,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  matchPermission,
  loadUserRoles,
  loadRolePermissions,
  loadUserPermissions,
  resolvePermissions,
} from './permission.guard';

export {
  parsePermissionCode,
  buildPermissionCode,
  isWildcardPermission,
  expandWildcardPermission,
  createPermissionMatcher,
  filterRolesByBranch,
  getTenantLevelRoles,
  getBranchLevelRoles,
  isContextComplete,
  assertContextComplete,
  sanitizeUserForLog,
  sanitizeTenantForLog,
  sanitizeBranchForLog,
  createContextSummary,
} from './authz.utils';
