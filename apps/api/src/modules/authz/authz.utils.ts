import type { Request } from 'express';
import { PERMISSION_WILDCARD, PERMISSION_SEPARATOR } from './authz.constants';
import type { AuthzUser, AuthzTenant, AuthzBranch, AuthzUserRole, RequestContext } from './authz.types';

export function parsePermissionCode(permissionCode: string): {
  resource: string;
  action: string;
  scope: string;
} | null {
  const parts = permissionCode.split(PERMISSION_SEPARATOR);
  if (parts.length !== 3) {
    return null;
  }
  return {
    resource: parts[0] || '',
    action: parts[1] || '',
    scope: parts[2] || '',
  };
}

export function buildPermissionCode(resource: string, action: string, scope: string): string {
  return [resource, action, scope].join(PERMISSION_SEPARATOR);
}

export function isWildcardPermission(permissionCode: string): boolean {
  return permissionCode.includes(PERMISSION_WILDCARD);
}

export function expandWildcardPermission(wildcardPermission: string, allPermissions: string[]): string[] {
  if (!isWildcardPermission(wildcardPermission)) {
    return [wildcardPermission];
  }

  const pattern = wildcardPermission
    .split(PERMISSION_WILDCARD)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');

  const regex = new RegExp(`^${pattern}$`);
  return allPermissions.filter((perm) => regex.test(perm));
}

export function createPermissionMatcher(permissions: ReadonlySet<string>) {
  return function matcher(requiredPermission: string): boolean {
    if (permissions.has(requiredPermission)) {
      return true;
    }

    if (permissions.has(PERMISSION_WILDCARD)) {
      return true;
    }

    const parts = requiredPermission.split(PERMISSION_SEPARATOR);

    for (let i = parts.length - 1; i >= 0; i--) {
      const wildcardPattern = [...parts.slice(0, i), PERMISSION_WILDCARD].join(PERMISSION_SEPARATOR);
      if (permissions.has(wildcardPattern)) {
        return true;
      }
    }

    return false;
  };
}

export function filterRolesByBranch(roles: AuthzUserRole[], branchId: string | null): AuthzUserRole[] {
  return roles.filter((role) => role.branchId === null || role.branchId === branchId);
}

export function getTenantLevelRoles(roles: AuthzUserRole[]): AuthzUserRole[] {
  return roles.filter((role) => role.branchId === null);
}

export function getBranchLevelRoles(roles: AuthzUserRole[], branchId: string): AuthzUserRole[] {
  return roles.filter((role) => role.branchId === branchId);
}

export function isContextComplete(req: Request): boolean {
  return (
    req.context !== undefined &&
    req.context.user !== undefined &&
    req.context.tenant !== undefined
  );
}

export function assertContextComplete(req: Request): asserts req is Request & { context: RequestContext } {
  if (!isContextComplete(req)) {
    throw new Error('Request context is incomplete');
  }
}

export function sanitizeUserForLog(user: AuthzUser): Partial<AuthzUser> {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    userType: user.userType,
    status: user.status,
  };
}

export function sanitizeTenantForLog(tenant: AuthzTenant): Partial<AuthzTenant> {
  return {
    id: tenant.id,
    code: tenant.code,
    status: tenant.status,
  };
}

export function sanitizeBranchForLog(branch: AuthzBranch | null): Partial<AuthzBranch> | null {
  if (!branch) {
    return null;
  }
  return {
    id: branch.id,
    tenantId: branch.tenantId,
    code: branch.code,
    status: branch.status,
  };
}

export function createContextSummary(context: RequestContext): Record<string, unknown> {
  return {
    requestId: context.requestId,
    userId: context.user.id,
    tenantId: context.tenant.id,
    branchId: context.branch?.id ?? null,
    roleCount: context.roles.length,
    permissionCount: context.permissions.size,
  };
}
