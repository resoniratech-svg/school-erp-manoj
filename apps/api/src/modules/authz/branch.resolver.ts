import type { Request, Response, NextFunction } from 'express';
import { db } from '@school-erp/database';
import { NotFoundError, ForbiddenError } from '@school-erp/shared';
import { AUTHZ_HEADERS, BRANCH_STATUS, AUTHZ_ERROR_CODES } from './authz.constants';
import type { AuthzBranch, AuthzUserBranch } from './authz.types';

const branchSelectFields = {
  id: true,
  tenantId: true,
  name: true,
  code: true,
  status: true,
} as const;

export async function findBranchById(branchId: string, tenantId: string): Promise<AuthzBranch | null> {
  const branch = await db.branch.findFirst({
    where: {
      id: branchId,
      tenantId,
    },
    select: branchSelectFields,
  });

  if (!branch) {
    return null;
  }

  return {
    id: branch.id,
    tenantId: branch.tenantId,
    name: branch.name,
    code: branch.code,
    status: branch.status,
  };
}

export async function findUserBranches(userId: string): Promise<AuthzUserBranch[]> {
  const userBranches = await db.userBranch.findMany({
    where: { userId },
    select: {
      branchId: true,
      isPrimary: true,
    },
  });

  return userBranches.map((ub) => ({
    branchId: ub.branchId,
    isPrimary: ub.isPrimary,
  }));
}

export function validateBranchStatus(branch: AuthzBranch): void {
  if (branch.status === BRANCH_STATUS.SUSPENDED) {
    throw new ForbiddenError('Branch is suspended', {
      code: AUTHZ_ERROR_CODES.BRANCH_SUSPENDED,
      branchId: branch.id,
    });
  }

  if (branch.status === BRANCH_STATUS.INACTIVE) {
    throw new ForbiddenError('Branch is inactive', {
      code: AUTHZ_ERROR_CODES.BRANCH_SUSPENDED,
      branchId: branch.id,
    });
  }
}

export function validateUserBranchAccess(branchId: string, userBranches: AuthzUserBranch[]): void {
  const hasAccess = userBranches.some((ub) => ub.branchId === branchId);

  if (!hasAccess) {
    throw new ForbiddenError('User does not have access to this branch', {
      code: AUTHZ_ERROR_CODES.BRANCH_ACCESS_DENIED,
      branchId,
    });
  }
}

export function getPrimaryBranch(userBranches: AuthzUserBranch[]): string | null {
  const primary = userBranches.find((ub) => ub.isPrimary);
  return primary?.branchId ?? userBranches[0]?.branchId ?? null;
}

export function createBranchResolver() {
  return async function branchResolver(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;

      if (!tenantId || !userId) {
        next();
        return;
      }

      const userBranches = await findUserBranches(userId);
      (req as Request & { userBranches: AuthzUserBranch[] }).userBranches = userBranches;

      const requestedBranchId = req.headers[AUTHZ_HEADERS.BRANCH_ID] as string | undefined;

      let targetBranchId: string | null = null;

      if (requestedBranchId) {
        targetBranchId = requestedBranchId;
      } else {
        targetBranchId = getPrimaryBranch(userBranches);
      }

      if (!targetBranchId) {
        (req as Request & { resolvedBranch: AuthzBranch | null }).resolvedBranch = null;
        next();
        return;
      }

      const branch = await findBranchById(targetBranchId, tenantId);

      if (!branch) {
        throw new NotFoundError('Branch not found', {
          code: AUTHZ_ERROR_CODES.BRANCH_NOT_FOUND,
          branchId: targetBranchId,
        });
      }

      if (branch.tenantId !== tenantId) {
        throw new ForbiddenError('Branch does not belong to tenant', {
          code: AUTHZ_ERROR_CODES.BRANCH_ACCESS_DENIED,
          branchId: targetBranchId,
        });
      }

      validateUserBranchAccess(targetBranchId, userBranches);
      validateBranchStatus(branch);

      (req as Request & { resolvedBranch: AuthzBranch }).resolvedBranch = branch;
      req.branchId = branch.id;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const branchResolver = createBranchResolver();

declare global {
  namespace Express {
    interface Request {
      resolvedBranch?: AuthzBranch | null;
      userBranches?: AuthzUserBranch[];
    }
  }
}
