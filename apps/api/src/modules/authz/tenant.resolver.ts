import type { Request, Response, NextFunction } from 'express';
import { db } from '@school-erp/database';
import { UnauthorizedError, ForbiddenError } from '@school-erp/shared';
import { TENANT_STATUS, AUTHZ_ERROR_CODES } from './authz.constants';
import type { AuthzTenant } from './authz.types';

const tenantSelectFields = {
  id: true,
  name: true,
  code: true,
  status: true,
} as const;

export async function findTenantById(tenantId: string): Promise<AuthzTenant | null> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: tenantSelectFields,
  });

  if (!tenant) {
    return null;
  }

  return {
    id: tenant.id,
    name: tenant.name,
    code: tenant.code,
    status: tenant.status,
  };
}

export function validateTenantStatus(tenant: AuthzTenant): void {
  if (tenant.status === TENANT_STATUS.SUSPENDED) {
    throw new ForbiddenError('Tenant account is suspended', {
      code: AUTHZ_ERROR_CODES.TENANT_SUSPENDED,
      tenantId: tenant.id,
    });
  }

  if (tenant.status === TENANT_STATUS.INACTIVE) {
    throw new ForbiddenError('Tenant account is inactive', {
      code: AUTHZ_ERROR_CODES.TENANT_SUSPENDED,
      tenantId: tenant.id,
    });
  }
}

export function createTenantResolver() {
  return async function tenantResolver(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        throw new UnauthorizedError('Tenant ID not found in request', {
          code: AUTHZ_ERROR_CODES.UNAUTHORIZED,
        });
      }

      const tenant = await findTenantById(tenantId);

      if (!tenant) {
        throw new UnauthorizedError('Tenant not found', {
          code: AUTHZ_ERROR_CODES.TENANT_NOT_FOUND,
          tenantId,
        });
      }

      validateTenantStatus(tenant);

      (req as Request & { resolvedTenant: AuthzTenant }).resolvedTenant = tenant;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const tenantResolver = createTenantResolver();

declare global {
  namespace Express {
    interface Request {
      resolvedTenant?: AuthzTenant;
    }
  }
}
