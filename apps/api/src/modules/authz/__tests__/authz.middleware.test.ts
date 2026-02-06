import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '@school-erp/shared';
import {
  extractBearerToken,
  verifyJwtToken,
  createAuthMiddleware,
} from '../authz.middleware';
import { AUTHZ_ERROR_CODES } from '../authz.constants';

vi.mock('jsonwebtoken');
vi.mock('@school-erp/database', () => ({
  db: {
    user: {
      findFirst: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
  },
}));

describe('authz.middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      headers: {},
      requestId: 'test-request-id',
    };
    mockRes = {};
    mockNext = vi.fn();
  });

  describe('extractBearerToken', () => {
    it('should return null for missing authorization header', () => {
      const result = extractBearerToken(undefined);
      expect(result).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(extractBearerToken('InvalidFormat')).toBeNull();
      expect(extractBearerToken('Basic token123')).toBeNull();
      expect(extractBearerToken('Bearer')).toBeNull();
    });

    it('should extract token from valid Bearer header', () => {
      const result = extractBearerToken('Bearer valid-token-123');
      expect(result).toBe('valid-token-123');
    });
  });

  describe('verifyJwtToken', () => {
    it('should throw UnauthorizedError for expired token', () => {
      (jwt.verify as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      expect(() => verifyJwtToken('expired-token')).toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for invalid token', () => {
      (jwt.verify as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      expect(() => verifyJwtToken('invalid-token')).toThrow(UnauthorizedError);
    });

    it('should return payload for valid token', () => {
      const mockPayload = {
        sub: 'user-123',
        tenantId: 'tenant-123',
        email: 'test@example.com',
        userType: 'admin',
        tokenVersion: 0,
      };
      (jwt.verify as ReturnType<typeof vi.fn>).mockReturnValue(mockPayload);

      const result = verifyJwtToken('valid-token');
      expect(result).toEqual(mockPayload);
    });
  });

  describe('createAuthMiddleware', () => {
    it('should throw UnauthorizedError when token is missing', async () => {
      const middleware = createAuthMiddleware();
      mockReq.headers = {};

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.details?.code).toBe(AUTHZ_ERROR_CODES.UNAUTHORIZED);
    });

    it('should throw UnauthorizedError for invalid token format', async () => {
      const middleware = createAuthMiddleware();
      mockReq.headers = { authorization: 'InvalidFormat' };

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should set user info on request for valid token', async () => {
      const mockPayload = {
        sub: 'user-123',
        tenantId: 'tenant-123',
        email: 'test@example.com',
        userType: 'admin',
        tokenVersion: 0,
      };
      (jwt.verify as ReturnType<typeof vi.fn>).mockReturnValue(mockPayload);

      const middleware = createAuthMiddleware();
      mockReq.headers = { authorization: 'Bearer valid-token' };

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.userId).toBe('user-123');
      expect(mockReq.tenantId).toBe('tenant-123');
      expect(mockReq.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
