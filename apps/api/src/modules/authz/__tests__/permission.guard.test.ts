import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@school-erp/shared';
import {
  matchPermission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  requirePermission,
  requirePermissions,
} from '../permission.guard';
import { AUTHZ_ERROR_CODES } from '../authz.constants';
import type { RequestContext, AuthzUser, AuthzTenant } from '../authz.types';

const mockUser: AuthzUser = {
  id: 'user-123',
  tenantId: 'tenant-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  userType: 'admin',
  status: 'active',
  tokenVersion: 0,
};

const mockTenant: AuthzTenant = {
  id: 'tenant-123',
  name: 'Test Tenant',
  code: 'TEST',
  status: 'active',
};

function createMockContext(permissions: string[]): RequestContext {
  return {
    requestId: 'test-request-id',
    user: mockUser,
    tenant: mockTenant,
    branch: null,
    roles: [],
    permissions: new Set(permissions),
    userBranches: [],
  };
}

describe('permission.guard', () => {
  describe('matchPermission', () => {
    it('should return true for exact permission match', () => {
      const permissions = new Set(['student:create:branch']);
      expect(matchPermission(permissions, 'student:create:branch')).toBe(true);
    });

    it('should return false for non-matching permission', () => {
      const permissions = new Set(['student:create:branch']);
      expect(matchPermission(permissions, 'student:delete:branch')).toBe(false);
    });

    it('should return true for global wildcard', () => {
      const permissions = new Set(['*']);
      expect(matchPermission(permissions, 'student:create:branch')).toBe(true);
    });

    it('should return true for resource wildcard', () => {
      const permissions = new Set(['student:*']);
      expect(matchPermission(permissions, 'student:create:branch')).toBe(true);
    });

    it('should return true for resource:action wildcard', () => {
      const permissions = new Set(['student:create:*']);
      expect(matchPermission(permissions, 'student:create:branch')).toBe(true);
    });

    it('should return false for non-matching wildcard', () => {
      const permissions = new Set(['fee:*']);
      expect(matchPermission(permissions, 'student:create:branch')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has the permission', () => {
      const permissions = new Set(['student:read:branch', 'student:create:branch']);
      expect(hasPermission(permissions, 'student:read:branch')).toBe(true);
    });

    it('should return false when user lacks the permission', () => {
      const permissions = new Set(['student:read:branch']);
      expect(hasPermission(permissions, 'student:delete:branch')).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', () => {
      const permissions = new Set(['student:read:branch', 'student:create:branch', 'student:update:branch']);
      const required = ['student:read:branch', 'student:create:branch'];
      expect(hasAllPermissions(permissions, required)).toBe(true);
    });

    it('should return false when user lacks one permission', () => {
      const permissions = new Set(['student:read:branch', 'student:create:branch']);
      const required = ['student:read:branch', 'student:delete:branch'];
      expect(hasAllPermissions(permissions, required)).toBe(false);
    });

    it('should return true for empty required permissions', () => {
      const permissions = new Set(['student:read:branch']);
      expect(hasAllPermissions(permissions, [])).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', () => {
      const permissions = new Set(['student:read:branch']);
      const required = ['student:read:branch', 'student:delete:branch'];
      expect(hasAnyPermission(permissions, required)).toBe(true);
    });

    it('should return false when user has none of the permissions', () => {
      const permissions = new Set(['fee:read:branch']);
      const required = ['student:read:branch', 'student:delete:branch'];
      expect(hasAnyPermission(permissions, required)).toBe(false);
    });

    it('should return false for empty required permissions', () => {
      const permissions = new Set(['student:read:branch']);
      expect(hasAnyPermission(permissions, [])).toBe(false);
    });
  });

  describe('requirePermission middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        requestId: 'test-request-id',
      };
      mockRes = {};
      mockNext = vi.fn();
    });

    it('should call next() when user has required permission', async () => {
      mockReq.context = createMockContext(['student:create:branch']);

      const middleware = requirePermission('student:create:branch');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw ForbiddenError when user lacks permission', async () => {
      mockReq.context = createMockContext(['student:read:branch']);

      const middleware = requirePermission('student:create:branch');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.details?.code).toBe(AUTHZ_ERROR_CODES.PERMISSION_DENIED);
    });

    it('should throw ForbiddenError when context is missing', async () => {
      mockReq.context = undefined;

      const middleware = requirePermission('student:create:branch');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should allow access with wildcard permission', async () => {
      mockReq.context = createMockContext(['student:*']);

      const middleware = requirePermission('student:create:branch');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requirePermissions middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        requestId: 'test-request-id',
      };
      mockRes = {};
      mockNext = vi.fn();
    });

    it('should allow access when user has all required permissions (mode: all)', async () => {
      mockReq.context = createMockContext(['student:read:branch', 'student:create:branch']);

      const middleware = requirePermissions(['student:read:branch', 'student:create:branch'], 'all');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when user lacks one permission (mode: all)', async () => {
      mockReq.context = createMockContext(['student:read:branch']);

      const middleware = requirePermissions(['student:read:branch', 'student:create:branch'], 'all');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should allow access when user has any required permission (mode: any)', async () => {
      mockReq.context = createMockContext(['student:read:branch']);

      const middleware = requirePermissions(['student:read:branch', 'student:create:branch'], 'any');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when user has none of the permissions (mode: any)', async () => {
      mockReq.context = createMockContext(['fee:read:branch']);

      const middleware = requirePermissions(['student:read:branch', 'student:create:branch'], 'any');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });
});
