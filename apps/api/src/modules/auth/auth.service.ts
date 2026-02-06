import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from '@school-erp/shared';
import { authRepository, AuthRepository } from './auth.repository';
import { toAuthUser, toAuthenticatedUser, toSessionInfoList } from './auth.mapper';
import { AUTH_CONSTANTS, AUTH_ERROR_CODES } from './auth.constants';
import type {
  JwtPayload,
  RefreshTokenPayload,
  TokenPair,
  SessionInfo,
  AuthUser,
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  SessionContext,
} from './auth.types';
import { getLogger } from '../../utils/logger';
import { env } from '../../config';

const logger = getLogger();

export class AuthService {
  constructor(private readonly repository: AuthRepository = authRepository) {}

  async login(request: LoginRequest, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const { email, password } = request;

    const user = await this.repository.findUserByEmail(email.toLowerCase());

    if (!user) {
      await this.simulatePasswordCheck();
      throw new UnauthorizedError('Invalid email or password', { code: AUTH_ERROR_CODES.INVALID_CREDENTIALS });
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError('Password not set for this account', { code: AUTH_ERROR_CODES.PASSWORD_REQUIRED });
    }

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password', { code: AUTH_ERROR_CODES.INVALID_CREDENTIALS });
    }

    this.validateUserStatus(user.status);

    const activeSessionCount = await this.repository.countActiveSessions(user.id);
    if (activeSessionCount >= AUTH_CONSTANTS.MAX_ACTIVE_SESSIONS) {
      await this.repository.deleteOldestSessions(user.id, AUTH_CONSTANTS.MAX_ACTIVE_SESSIONS - 1);
    }

    const tokens = await this.createTokenPair(user.id, user.tenantId, user.email, user.userType, ipAddress, userAgent);

    await this.repository.updateLastLogin(user.id);

    logger.info('User logged in successfully', { userId: user.id, tenantId: user.tenantId });

    return {
      user: toAuthUser(user),
      tokens,
    };
  }

  async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    const payload = this.verifyRefreshToken(refreshToken);

    const refreshTokenHash = this.hashToken(refreshToken);
    const session = await this.repository.findSessionByRefreshTokenHash(refreshTokenHash);

    if (!session) {
      throw new UnauthorizedError('Invalid refresh token', { code: AUTH_ERROR_CODES.INVALID_REFRESH_TOKEN });
    }

    if (session.revokedAt) {
      logger.warn('Attempted use of revoked refresh token', { sessionId: session.id, userId: session.userId });
      await this.repository.revokeAllUserSessions(session.userId);
      throw new UnauthorizedError('Session has been revoked', { code: AUTH_ERROR_CODES.SESSION_REVOKED });
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedError('Session has expired', { code: AUTH_ERROR_CODES.SESSION_EXPIRED });
    }

    const user = session.user;
    if (!user) {
      throw new UnauthorizedError('User not found', { code: AUTH_ERROR_CODES.USER_NOT_FOUND });
    }

    this.validateUserStatus(user.status);

    const newRefreshToken = this.generateRefreshToken();
    const newRefreshTokenHash = this.hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_MS);

    await this.repository.updateSessionRefreshToken(session.id, newRefreshTokenHash, expiresAt);

    const accessToken = this.generateAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      userType: user.userType,
      tokenVersion: user.passwordChangedAt ? Math.floor(user.passwordChangedAt.getTime() / 1000) : 0,
    });

    logger.info('Token refreshed successfully', { userId: user.id, sessionId: session.id });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY_MS,
    };
  }

  async logout(sessionId: string, userId: string): Promise<void> {
    const session = await this.repository.findSessionById(sessionId);

    if (!session) {
      throw new NotFoundError('Session not found', { code: AUTH_ERROR_CODES.SESSION_NOT_FOUND });
    }

    if (session.userId !== userId) {
      throw new ForbiddenError('Not authorized to revoke this session');
    }

    await this.repository.revokeSession(sessionId);
    logger.info('User logged out', { userId, sessionId });
  }

  async logoutAllSessions(userId: string, exceptCurrentSessionId?: string): Promise<number> {
    const result = await this.repository.revokeAllUserSessions(userId, exceptCurrentSessionId);
    logger.info('All user sessions revoked', { userId, revokedCount: result.count });
    return result.count;
  }

  async getCurrentUser(userId: string, tenantId: string): Promise<AuthenticatedUser> {
    const user = await this.repository.findUserWithBranchesAndRoles(userId, tenantId);

    if (!user) {
      throw new NotFoundError('User not found', { code: AUTH_ERROR_CODES.USER_NOT_FOUND });
    }

    return toAuthenticatedUser(user);
  }

  async getActiveSessions(userId: string, currentSessionId?: string): Promise<SessionInfo[]> {
    const sessions = await this.repository.findActiveSessionsByUserId(userId);
    return toSessionInfoList(sessions, currentSessionId);
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.repository.findSessionById(sessionId);

    if (!session) {
      throw new NotFoundError('Session not found', { code: AUTH_ERROR_CODES.SESSION_NOT_FOUND });
    }

    if (session.userId !== userId) {
      throw new ForbiddenError('Not authorized to revoke this session');
    }

    await this.repository.revokeSession(sessionId);
    logger.info('Session revoked', { userId, sessionId });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    sessionId?: string
  ): Promise<void> {
    const user = await this.repository.findUserById(userId, '');

    if (!user) {
      throw new NotFoundError('User not found', { code: AUTH_ERROR_CODES.USER_NOT_FOUND });
    }

    if (!user.passwordHash) {
      throw new BadRequestError('No password set for this account');
    }

    const isValidPassword = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect', { code: AUTH_ERROR_CODES.PASSWORD_MISMATCH });
    }

    const newPasswordHash = await this.hashPassword(newPassword);
    await this.repository.updatePassword(userId, newPasswordHash);

    await this.repository.revokeAllUserSessions(userId, sessionId);
    await this.repository.invalidatePasswordResetTokens(userId);

    logger.info('Password changed successfully', { userId });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.repository.findUserByEmail(email.toLowerCase());

    if (!user) {
      logger.info('Password reset requested for non-existent email', { email });
      return;
    }

    if (user.status !== 'active') {
      logger.info('Password reset requested for inactive user', { userId: user.id });
      return;
    }

    await this.repository.invalidatePasswordResetTokens(user.id);

    const resetToken = this.generateResetToken();
    const tokenHash = this.hashToken(resetToken);
    const expiresAt = new Date(Date.now() + AUTH_CONSTANTS.PASSWORD_RESET_EXPIRY_MS);

    await this.repository.createPasswordResetToken(user.id, tokenHash, expiresAt);

    logger.info('Password reset token created', { userId: user.id });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const resetToken = await this.repository.findValidPasswordResetToken(tokenHash);

    if (!resetToken) {
      throw new BadRequestError('Invalid or expired reset token', { code: AUTH_ERROR_CODES.RESET_TOKEN_INVALID });
    }

    const newPasswordHash = await this.hashPassword(newPassword);
    await this.repository.updatePassword(resetToken.userId, newPasswordHash);

    await this.repository.markPasswordResetTokenUsed(resetToken.id);
    await this.repository.revokeAllUserSessions(resetToken.userId);

    logger.info('Password reset successfully', { userId: resetToken.userId });
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET || 'fallback-secret') as JwtPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired', { code: AUTH_ERROR_CODES.TOKEN_EXPIRED });
      }
      throw new UnauthorizedError('Invalid token', { code: AUTH_ERROR_CODES.INVALID_TOKEN });
    }
  }

  private validateUserStatus(status: string): void {
    switch (status) {
      case 'suspended':
        throw new ForbiddenError('Account is suspended', { code: AUTH_ERROR_CODES.ACCOUNT_SUSPENDED });
      case 'inactive':
        throw new ForbiddenError('Account is inactive', { code: AUTH_ERROR_CODES.ACCOUNT_INACTIVE });
      case 'pending':
        throw new ForbiddenError('Account is pending activation', { code: AUTH_ERROR_CODES.ACCOUNT_PENDING });
    }
  }

  private async createTokenPair(
    userId: string,
    tenantId: string,
    email: string,
    userType: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair> {
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_MS);

    const session = await this.repository.createSession({
      userId,
      refreshTokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    });

    const accessToken = this.generateAccessToken({
      sub: userId,
      tenantId,
      email,
      userType: userType as JwtPayload['userType'],
      tokenVersion: 0,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY_MS,
    };
  }

  private generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.JWT_SECRET || 'fallback-secret', {
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256',
    });
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('base64url');
  }

  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  private async simulatePasswordCheck(): Promise<void> {
    await argon2.hash('dummy-password', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  private verifyRefreshToken(token: string): RefreshTokenPayload {
    return { sub: '', sessionId: '', tokenVersion: 0 };
  }
}

export const authService = new AuthService();
