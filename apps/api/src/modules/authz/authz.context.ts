import type { Request } from 'express';
import type {
  RequestContext,
  PartialRequestContext,
  AuthzUser,
  AuthzTenant,
  AuthzBranch,
  AuthzUserRole,
  AuthzUserBranch,
} from './authz.types';

class RequestContextBuilder {
  private context: PartialRequestContext;

  constructor(requestId: string) {
    this.context = { requestId };
  }

  setUser(user: AuthzUser): this {
    this.context.user = user;
    return this;
  }

  setTenant(tenant: AuthzTenant): this {
    this.context.tenant = tenant;
    return this;
  }

  setBranch(branch: AuthzBranch | null): this {
    this.context.branch = branch;
    return this;
  }

  setRoles(roles: AuthzUserRole[]): this {
    this.context.roles = roles;
    return this;
  }

  setPermissions(permissions: Set<string>): this {
    this.context.permissions = permissions;
    return this;
  }

  setUserBranches(userBranches: AuthzUserBranch[]): this {
    this.context.userBranches = userBranches;
    return this;
  }

  build(): RequestContext {
    if (!this.context.user) {
      throw new Error('User is required to build RequestContext');
    }
    if (!this.context.tenant) {
      throw new Error('Tenant is required to build RequestContext');
    }

    return Object.freeze({
      requestId: this.context.requestId,
      user: Object.freeze({ ...this.context.user }),
      tenant: Object.freeze({ ...this.context.tenant }),
      branch: this.context.branch ? Object.freeze({ ...this.context.branch }) : null,
      roles: Object.freeze([...(this.context.roles ?? [])]) as AuthzUserRole[],
      permissions: new Set(this.context.permissions ?? []) as ReadonlySet<string>,
      userBranches: Object.freeze([...(this.context.userBranches ?? [])]) as AuthzUserBranch[],
    });
  }
}

export function createRequestContextBuilder(requestId: string): RequestContextBuilder {
  return new RequestContextBuilder(requestId);
}

export function getRequestContext(req: Request): RequestContext {
  if (!req.context) {
    throw new Error('Request context not initialized');
  }
  return req.context;
}

export function hasRequestContext(req: Request): boolean {
  return req.context !== undefined;
}

export function setRequestContext(req: Request, context: RequestContext): void {
  if (req.context) {
    throw new Error('Request context already set');
  }
  req.context = context;
}

export function getUserFromContext(req: Request): AuthzUser {
  return getRequestContext(req).user;
}

export function getTenantFromContext(req: Request): AuthzTenant {
  return getRequestContext(req).tenant;
}

export function getBranchFromContext(req: Request): AuthzBranch | null {
  return getRequestContext(req).branch;
}

export function getPermissionsFromContext(req: Request): ReadonlySet<string> {
  return getRequestContext(req).permissions;
}

export function getRolesFromContext(req: Request): AuthzUserRole[] {
  return getRequestContext(req).roles;
}

export function getUserBranchesFromContext(req: Request): AuthzUserBranch[] {
  return getRequestContext(req).userBranches;
}
