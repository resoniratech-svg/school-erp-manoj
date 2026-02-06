import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';
import { UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError } from '@school-erp/shared';
import * as argon2 from 'argon2';

vi.mock('argon2');
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock-access-token'),
    verify: vi.fn().mockReturnValue({
      sub: 'user-id',
      tenantId: 'tenant-id',
      email: 'test@example.com',
      userType: 'admin',
      tokenVersion: 0,
    }),
  },
}));

const mockUser = {
  id: 'user-id',
  tenantId: 'tenant-id',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  firstName: 'John',
  lastName: 'Doe',
  phone: null,
  avatarUrl: null,
  userType: 'admin' as const,
  status: 'active' as const,
  emailVerifiedAt: new Date(),
  lastLoginAt: null,
  passwordChangedAt: null,
};

const mockSession = {
  id: 'session-id',
  userId: 'user-id',
  refreshTokenHash: 'token-hash',
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  lastUsedAt: new Date(),
  createdAt: new Date(),
  revokedAt: null,
  user: mockUser,
};

describe('AuthService', () => {
  let authService: AuthService;
  let mockRepository: Partial<AuthRepository>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      findUserByEmail: vi.fn(),
      findUserById: vi.fn(),
      findUserWithBranchesAndRoles: vi.fn(),
      updateLastLogin: vi.fn(),
      updatePassword: vi.fn(),
      createSession: vi.fn(),
      findSessionById: vi.fn(),
      findSessionByRefreshTokenHash: vi.fn(),
      findActiveSessionsByUserId: vi.fn(),
      updateSessionLastUsed: vi.fn(),
      updateSessionRefreshToken: vi.fn(),
      revokeSession: vi.fn(),
      revokeAllUserSessions: vi.fn(),
      countActiveSessions: vi.fn(),
      deleteOldestSessions: vi.fn(),
      createPasswordResetToken: vi.fn(),
      findValidPasswordResetToken: vi.fn(),
      markPasswordResetTokenUsed: vi.fn(),
      invalidatePasswordResetTokens: vi.fn(),
    };

    authService = new AuthService(mockRepository as AuthRepository);
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      (mockRepository.findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (mockRepository.countActiveSessions as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (mockRepository.createSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
      (mockRepository.updateLastLogin as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (argon2.verify as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await authService.login(
        { email: 'test@example.com', password: 'password123' },
        '127.0.0.1',
        'test-agent'
      );

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(mockRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      (mockRepository.findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (argon2.verify as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (argon2.hash as ReturnType<typeof vi.fn>).mockResolvedValue('dummy-hash');

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrong-password' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      (mockRepository.findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (argon2.hash as ReturnType<typeof vi.fn>).mockResolvedValue('dummy-hash');

      await expect(
        authService.login({ email: 'nonexistent@example.com', password: 'password123' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw ForbiddenError for suspended user', async () => {
      const suspendedUser = { ...mockUser, status: 'suspended' as const };
      (mockRepository.findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(suspendedUser);
      (argon2.verify as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      await expect(
        authService.login({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError for inactive user', async () => {
      const inactiveUser = { ...mockUser, status: 'inactive' as const };
      (mockRepository.findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(inactiveUser);
      (argon2.verify as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      await expect(
        authService.login({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens', async () => {
      (mockRepository.findSessionByRefreshTokenHash as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
      (mockRepository.updateSessionRefreshToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedError for invalid refresh token', async () => {
      (mockRepository.findSessionByRefreshTokenHash as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedError);
    });

    it('should revoke all sessions when using revoked token', async () => {
      const revokedSession = { ...mockSession, revokedAt: new Date() };
      (mockRepository.findSessionByRefreshTokenHash as ReturnType<typeof vi.fn>).mockResolvedValue(revokedSession);
      (mockRepository.revokeAllUserSessions as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

      await expect(authService.refreshToken('revoked-token')).rejects.toThrow(UnauthorizedError);
      expect(mockRepository.revokeAllUserSessions).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      (mockRepository.findSessionById as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
      (mockRepository.revokeSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);

      await expect(authService.logout('session-id', 'user-id')).resolves.toBeUndefined();
      expect(mockRepository.revokeSession).toHaveBeenCalledWith('session-id');
    });

    it('should throw NotFoundError for non-existent session', async () => {
      (mockRepository.findSessionById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(authService.logout('invalid-session', 'user-id')).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError for unauthorized session revocation', async () => {
      (mockRepository.findSessionById as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);

      await expect(authService.logout('session-id', 'different-user-id')).rejects.toThrow(ForbiddenError);
    });
  });

  describe('revokeSession', () => {
    it('should successfully revoke a session', async () => {
      (mockRepository.findSessionById as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
      (mockRepository.revokeSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);

      await expect(authService.revokeSession('session-id', 'user-id')).resolves.toBeUndefined();
    });

    it('should throw NotFoundError for non-existent session', async () => {
      (mockRepository.findSessionById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(authService.revokeSession('invalid-session', 'user-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return authenticated user with roles and permissions', async () => {
      const userWithRoles = {
        ...mockUser,
        userBranches: [{ branchId: 'branch-1', isPrimary: true }],
        userRoles: [
          {
            roleId: 'role-1',
            branchId: null,
            role: {
              code: 'ADMIN',
              rolePermissions: [{ permission: { code: 'user:read:all' } }],
            },
          },
        ],
      };
      (mockRepository.findUserWithBranchesAndRoles as ReturnType<typeof vi.fn>).mockResolvedValue(userWithRoles);

      const result = await authService.getCurrentUser('user-id', 'tenant-id');

      expect(result.email).toBe('test@example.com');
      expect(result.branches).toHaveLength(1);
      expect(result.roles).toHaveLength(1);
      expect(result.permissions).toContain('user:read:all');
    });

    it('should throw NotFoundError for non-existent user', async () => {
      (mockRepository.findUserWithBranchesAndRoles as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(authService.getCurrentUser('invalid-user', 'tenant-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getActiveSessions', () => {
    it('should return list of active sessions', async () => {
      const sessions = [mockSession];
      (mockRepository.findActiveSessionsByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(sessions);

      const result = await authService.getActiveSessions('user-id', 'session-id');

      expect(result).toHaveLength(1);
      expect(result[0].isCurrent).toBe(true);
    });
  });
});
