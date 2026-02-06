import type { Request, Response, NextFunction } from 'express';
import type { UserType, UserStatus, TenantStatus, BranchStatus } from '@school-erp/database';

export interface AuthzUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  status: UserStatus;
  tokenVersion: number;
}

export interface AuthzTenant {
  id: string;
  name: string;
  code: string;
  status: TenantStatus;
}

export interface AuthzBranch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  status: BranchStatus;
}

export interface AuthzRole {
  id: string;
  code: string;
  name: string;
  tenantId: string;
  branchId: string | null;
  isSystemRole: boolean;
}

export interface AuthzUserRole {
  roleId: string;
  roleCode: string;
  branchId: string | null;
}

export interface AuthzUserBranch {
  branchId: string;
  isPrimary: boolean;
}

export interface RequestContext {
  readonly requestId: string;
  readonly user: AuthzUser;
  readonly tenant: AuthzTenant;
  readonly branch: AuthzBranch | null;
  readonly roles: AuthzUserRole[];
  readonly permissions: ReadonlySet<string>;
  readonly userBranches: AuthzUserBranch[];
}

export interface PartialRequestContext {
  requestId: string;
  user?: AuthzUser;
  tenant?: AuthzTenant;
  branch?: AuthzBranch | null;
  roles?: AuthzUserRole[];
  permissions?: Set<string>;
  userBranches?: AuthzUserBranch[];
}

export type AuthzMiddleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export type PermissionGuard = (requiredPermission: string) => AuthzMiddleware;

export type PermissionGuardMultiple = (requiredPermissions: string[], mode: 'all' | 'any') => AuthzMiddleware;

export interface JwtPayloadExtended {
  sub: string;
  tenantId: string;
  email: string;
  userType: UserType;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}
