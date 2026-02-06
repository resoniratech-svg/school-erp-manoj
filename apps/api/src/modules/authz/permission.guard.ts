import type { Request, Response, NextFunction } from 'express';
import { db } from '@school-erp/database';
import { ForbiddenError } from '@school-erp/shared';
import { PERMISSION_WILDCARD, PERMISSION_SEPARATOR, AUTHZ_ERROR_CODES } from './authz.constants';
import type { AuthzUserRole } from './authz.types';
import { getRequestContext, hasRequestContext } from './authz.context';

interface RoleWithPermissions {
  roleId: string;
  roleCode: string;
  branchId: string | null;
  permissions: string[];
}

export async function loadUserRoles(userId: string): Promise<AuthzUserRole[]> {
  const userRoles = await db.userRole.findMany({
    where: { userId },
    select: {
      roleId: true,
      branchId: true,
      role: {
        select: {
          code: true,
        },
      },
    },
  });

  return userRoles.map((ur) => ({
    roleId: ur.roleId,
    roleCode: ur.role.code,
    branchId: ur.branchId,
  }));
}

export async function loadRolePermissions(roleIds: string[]): Promise<Map<string, string[]>> {
  const rolePermissions = await db.rolePermission.findMany({
    where: {
      roleId: { in: roleIds },
    },
    select: {
      roleId: true,
      permission: {
        select: {
          code: true,
        },
      },
    },
  });

  const permissionMap = new Map<string, string[]>();

  for (const rp of rolePermissions) {
    const existing = permissionMap.get(rp.roleId) ?? [];
    existing.push(rp.permission.code);
    permissionMap.set(rp.roleId, existing);
  }

  return permissionMap;
}

export function resolvePermissions(userRoles: AuthzUserRole[]): Set<string> {
  return new Set<string>();
}

export async function loadUserPermissions(userId: string): Promise<Set<string>> {
  const userRoles = await loadUserRoles(userId);
  const roleIds = userRoles.map((r) => r.roleId);

  if (roleIds.length === 0) {
    return new Set<string>();
  }

  const permissionMap = await loadRolePermissions(roleIds);

  const permissions = new Set<string>();
  for (const roleId of roleIds) {
    const rolePerms = permissionMap.get(roleId) ?? [];
    for (const perm of rolePerms) {
      permissions.add(perm);
    }
  }

  return permissions;
}

export function matchPermission(userPermissions: ReadonlySet<string>, requiredPermission: string): boolean {
  if (userPermissions.has(requiredPermission)) {
    return true;
  }

  if (userPermissions.has(PERMISSION_WILDCARD)) {
    return true;
  }

  const parts = requiredPermission.split(PERMISSION_SEPARATOR);

  for (let i = parts.length - 1; i >= 0; i--) {
    const wildcardPattern = [...parts.slice(0, i), PERMISSION_WILDCARD].join(PERMISSION_SEPARATOR);
    if (userPermissions.has(wildcardPattern)) {
      return true;
    }
  }

  return false;
}

export function hasPermission(userPermissions: ReadonlySet<string>, requiredPermission: string): boolean {
  return matchPermission(userPermissions, requiredPermission);
}

export function hasAllPermissions(userPermissions: ReadonlySet<string>, requiredPermissions: string[]): boolean {
  return requiredPermissions.every((perm) => matchPermission(userPermissions, perm));
}

export function hasAnyPermission(userPermissions: ReadonlySet<string>, requiredPermissions: string[]): boolean {
  return requiredPermissions.some((perm) => matchPermission(userPermissions, perm));
}

export function requirePermission(requiredPermission: string) {
  return async function permissionGuard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!hasRequestContext(req)) {
        throw new ForbiddenError('Request context not initialized', {
          code: AUTHZ_ERROR_CODES.PERMISSION_DENIED,
        });
      }

      const context = getRequestContext(req);
      const userPermissions = context.permissions;

      if (!hasPermission(userPermissions, requiredPermission)) {
        throw new ForbiddenError(`Missing required permission: ${requiredPermission}`, {
          code: AUTHZ_ERROR_CODES.PERMISSION_DENIED,
          requiredPermission,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requirePermissions(requiredPermissions: string[], mode: 'all' | 'any' = 'all') {
  return async function permissionsGuard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!hasRequestContext(req)) {
        throw new ForbiddenError('Request context not initialized', {
          code: AUTHZ_ERROR_CODES.PERMISSION_DENIED,
        });
      }

      const context = getRequestContext(req);
      const userPermissions = context.permissions;

      const hasRequired = mode === 'all'
        ? hasAllPermissions(userPermissions, requiredPermissions)
        : hasAnyPermission(userPermissions, requiredPermissions);

      if (!hasRequired) {
        throw new ForbiddenError(
          `Missing required permissions (${mode}): ${requiredPermissions.join(', ')}`,
          {
            code: AUTHZ_ERROR_CODES.PERMISSION_DENIED,
            requiredPermissions,
            mode,
          }
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAnyPermission(...requiredPermissions: string[]) {
  return requirePermissions(requiredPermissions, 'any');
}

export function requireAllPermissions(...requiredPermissions: string[]) {
  return requirePermissions(requiredPermissions, 'all');
}

export function requireRole(roleCode: string) {
  return async function roleGuard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!hasRequestContext(req)) {
        throw new ForbiddenError('Request context not initialized', {
          code: AUTHZ_ERROR_CODES.PERMISSION_DENIED,
        });
      }

      const context = getRequestContext(req);
      const userRoles = context.roles;

      const hasRole = userRoles.some((r) => r.roleCode === roleCode);

      if (!hasRole) {
        throw new ForbiddenError(`Missing required role: ${roleCode}`, {
          code: AUTHZ_ERROR_CODES.PERMISSION_DENIED,
          requiredRole: roleCode,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireBranchAccess() {
  return async function branchAccessGuard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!hasRequestContext(req)) {
        throw new ForbiddenError('Request context not initialized', {
          code: AUTHZ_ERROR_CODES.PERMISSION_DENIED,
        });
      }

      const context = getRequestContext(req);

      if (!context.branch) {
        throw new ForbiddenError('Branch context is required for this operation', {
          code: AUTHZ_ERROR_CODES.BRANCH_ACCESS_DENIED,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
