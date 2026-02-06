import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '@school-erp/database';
import { UnauthorizedError, ForbiddenError } from '@school-erp/shared';
import { env } from '../../config';
import { USER_STATUS, AUTHZ_ERROR_CODES } from './authz.constants';
import type { AuthzUser, JwtPayloadExtended } from './authz.types';
import { createRequestContextBuilder, setRequestContext } from './authz.context';
import { findTenantById, validateTenantStatus } from './tenant.resolver';
import { findBranchById, findUserBranches, validateBranchStatus, validateUserBranchAccess, getPrimaryBranch } from './branch.resolver';
import { loadUserRoles, resolvePermissions } from './permission.guard';
import { AUTHZ_HEADERS } from './authz.constants';

const userSelectFields = {
  id: true,
  tenantId: true,
  email: true,
  firstName: true,
  lastName: true,
  userType: true,
  status: true,
  passwordChangedAt: true,
} as const;

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}

export function verifyJwtToken(token: string): JwtPayloadExtended {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET || 'fallback-secret') as JwtPayloadExtended;
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired', {
        code: AUTHZ_ERROR_CODES.TOKEN_EXPIRED,
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token', {
        code: AUTHZ_ERROR_CODES.INVALID_TOKEN,
      });
    }
    throw new UnauthorizedError('Token verification failed', {
      code: AUTHZ_ERROR_CODES.INVALID_TOKEN,
    });
  }
}

export async function findUserById(userId: string, tenantId: string): Promise<AuthzUser | null> {
  const user = await db.user.findFirst({
    where: {
      id: userId,
      tenantId,
      deletedAt: null,
    },
    select: userSelectFields,
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    userType: user.userType,
    status: user.status,
    tokenVersion: user.passwordChangedAt ? Math.floor(user.passwordChangedAt.getTime() / 1000) : 0,
  };
}

export function validateUserStatus(user: AuthzUser): void {
  if (user.status === USER_STATUS.SUSPENDED) {
    throw new ForbiddenError('User account is suspended', {
      code: AUTHZ_ERROR_CODES.USER_SUSPENDED,
      userId: user.id,
    });
  }

  if (user.status === USER_STATUS.INACTIVE) {
    throw new ForbiddenError('User account is inactive', {
      code: AUTHZ_ERROR_CODES.USER_SUSPENDED,
      userId: user.id,
    });
  }

  if (user.status === USER_STATUS.PENDING) {
    throw new ForbiddenError('User account is pending activation', {
      code: AUTHZ_ERROR_CODES.USER_SUSPENDED,
      userId: user.id,
    });
  }
}

export function createAuthMiddleware() {
  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = extractBearerToken(req.headers.authorization);

      if (!token) {
        throw new UnauthorizedError('Authorization token is required', {
          code: AUTHZ_ERROR_CODES.UNAUTHORIZED,
        });
      }

      const payload = verifyJwtToken(token);

      req.userId = payload.sub;
      req.tenantId = payload.tenantId;
      req.user = payload;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function createFullAuthMiddleware() {
  return async function fullAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = extractBearerToken(req.headers.authorization);

      if (!token) {
        throw new UnauthorizedError('Authorization token is required', {
          code: AUTHZ_ERROR_CODES.UNAUTHORIZED,
        });
      }

      const payload = verifyJwtToken(token);

      const tenant = await findTenantById(payload.tenantId);
      if (!tenant) {
        throw new UnauthorizedError('Tenant not found', {
          code: AUTHZ_ERROR_CODES.TENANT_NOT_FOUND,
        });
      }
      validateTenantStatus(tenant);

      const user = await findUserById(payload.sub, payload.tenantId);
      if (!user) {
        throw new UnauthorizedError('User not found', {
          code: AUTHZ_ERROR_CODES.UNAUTHORIZED,
        });
      }
      validateUserStatus(user);

      const userBranches = await findUserBranches(user.id);

      const requestedBranchId = req.headers[AUTHZ_HEADERS.BRANCH_ID] as string | undefined;
      let branch = null;

      const targetBranchId = requestedBranchId || getPrimaryBranch(userBranches);

      if (targetBranchId) {
        branch = await findBranchById(targetBranchId, tenant.id);
        if (branch) {
          validateUserBranchAccess(targetBranchId, userBranches);
          validateBranchStatus(branch);
        }
      }

      const userRoles = await loadUserRoles(user.id);
      const permissions = resolvePermissions(userRoles);

      const context = createRequestContextBuilder(req.requestId)
        .setUser(user)
        .setTenant(tenant)
        .setBranch(branch)
        .setRoles(userRoles)
        .setPermissions(permissions)
        .setUserBranches(userBranches)
        .build();

      setRequestContext(req, context);

      req.userId = user.id;
      req.tenantId = tenant.id;
      req.branchId = branch?.id;
      req.user = payload;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const authMiddleware = createAuthMiddleware();
export const fullAuthMiddleware = createFullAuthMiddleware();
