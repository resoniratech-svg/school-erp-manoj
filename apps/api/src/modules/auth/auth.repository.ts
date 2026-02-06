import { db } from '@school-erp/database';
import type { CreateSessionInput } from './auth.types';

const userSelectFields = {
  id: true,
  tenantId: true,
  email: true,
  passwordHash: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  userType: true,
  status: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  passwordChangedAt: true,
} as const;

const sessionSelectFields = {
  id: true,
  userId: true,
  refreshTokenHash: true,
  ipAddress: true,
  userAgent: true,
  expiresAt: true,
  lastUsedAt: true,
  createdAt: true,
  revokedAt: true,
} as const;

export class AuthRepository {
  async findUserByEmail(email: string, tenantId?: string) {
    const whereClause = tenantId ? { email, tenantId, deletedAt: null } : { email, deletedAt: null };

    return db.user.findFirst({
      where: whereClause,
      select: userSelectFields,
    });
  }

  async findUserById(userId: string, tenantId: string) {
    return db.user.findFirst({
      where: {
        id: userId,
        tenantId,
        deletedAt: null,
      },
      select: userSelectFields,
    });
  }

  async findUserWithBranchesAndRoles(userId: string, tenantId: string) {
    return db.user.findFirst({
      where: {
        id: userId,
        tenantId,
        deletedAt: null,
      },
      select: {
        ...userSelectFields,
        userBranches: {
          select: {
            branchId: true,
            isPrimary: true,
          },
        },
        userRoles: {
          select: {
            roleId: true,
            branchId: true,
            role: {
              select: {
                code: true,
                rolePermissions: {
                  select: {
                    permission: {
                      select: {
                        code: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateLastLogin(userId: string) {
    return db.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return db.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    });
  }

  async createSession(input: CreateSessionInput) {
    return db.authSession.create({
      data: {
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        expiresAt: input.expiresAt,
        lastUsedAt: new Date(),
      },
      select: sessionSelectFields,
    });
  }

  async findSessionById(sessionId: string) {
    return db.authSession.findUnique({
      where: { id: sessionId },
      select: {
        ...sessionSelectFields,
        user: {
          select: userSelectFields,
        },
      },
    });
  }

  async findSessionByRefreshTokenHash(refreshTokenHash: string) {
    return db.authSession.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        ...sessionSelectFields,
        user: {
          select: userSelectFields,
        },
      },
    });
  }

  async findActiveSessionsByUserId(userId: string) {
    return db.authSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: sessionSelectFields,
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async updateSessionLastUsed(sessionId: string) {
    return db.authSession.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date() },
    });
  }

  async updateSessionRefreshToken(sessionId: string, refreshTokenHash: string, expiresAt: Date) {
    return db.authSession.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });
  }

  async revokeSession(sessionId: string) {
    return db.authSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string, exceptSessionId?: string) {
    const whereClause: { userId: string; revokedAt: null; id?: { not: string } } = {
      userId,
      revokedAt: null,
    };

    if (exceptSessionId) {
      whereClause.id = { not: exceptSessionId };
    }

    return db.authSession.updateMany({
      where: whereClause,
      data: { revokedAt: new Date() },
    });
  }

  async countActiveSessions(userId: string) {
    return db.authSession.count({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async deleteOldestSessions(userId: string, keepCount: number) {
    const sessions = await db.authSession.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      skip: keepCount,
      select: { id: true },
    });

    if (sessions.length > 0) {
      await db.authSession.updateMany({
        where: {
          id: { in: sessions.map((s) => s.id) },
        },
        data: { revokedAt: new Date() },
      });
    }

    return sessions.length;
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return db.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findValidPasswordResetToken(tokenHash: string) {
    return db.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: userSelectFields,
        },
      },
    });
  }

  async markPasswordResetTokenUsed(tokenId: string) {
    return db.passwordResetToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
  }

  async invalidatePasswordResetTokens(userId: string) {
    return db.passwordResetToken.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });
  }

  async cleanupExpiredSessions() {
    return db.authSession.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }
}

export const authRepository = new AuthRepository();
