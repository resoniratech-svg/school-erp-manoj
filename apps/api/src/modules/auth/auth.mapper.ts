import type {
  AuthUser,
  AuthUserWithPassword,
  SessionInfo,
  AuthenticatedUser,
  UserBranchInfo,
  UserRoleInfo,
} from './auth.types';

type UserEntity = {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  userType: string;
  status: string;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
};

type SessionEntity = {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date;
};

type UserWithRolesEntity = UserEntity & {
  userBranches: { branchId: string; isPrimary: boolean }[];
  userRoles: {
    roleId: string;
    branchId: string | null;
    role: {
      code: string;
      rolePermissions: {
        permission: {
          code: string;
        };
      }[];
    };
  }[];
};

export function toAuthUser(entity: UserEntity): AuthUser {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    email: entity.email,
    firstName: entity.firstName,
    lastName: entity.lastName,
    phone: entity.phone,
    avatarUrl: entity.avatarUrl,
    userType: entity.userType as AuthUser['userType'],
    status: entity.status as AuthUser['status'],
    emailVerifiedAt: entity.emailVerifiedAt,
    lastLoginAt: entity.lastLoginAt,
    passwordChangedAt: entity.passwordChangedAt,
  };
}

export function toAuthUserWithPassword(entity: UserEntity): AuthUserWithPassword {
  return {
    ...toAuthUser(entity),
    passwordHash: entity.passwordHash,
  };
}

export function toSessionInfo(entity: SessionEntity, currentSessionId?: string): SessionInfo {
  return {
    id: entity.id,
    userId: entity.userId,
    ipAddress: entity.ipAddress,
    userAgent: entity.userAgent,
    lastUsedAt: entity.lastUsedAt,
    createdAt: entity.createdAt,
    expiresAt: entity.expiresAt,
    isCurrent: currentSessionId === entity.id,
  };
}

export function toSessionInfoList(entities: SessionEntity[], currentSessionId?: string): SessionInfo[] {
  return entities.map((entity) => toSessionInfo(entity, currentSessionId));
}

export function toAuthenticatedUser(entity: UserWithRolesEntity): AuthenticatedUser {
  const branches: UserBranchInfo[] = entity.userBranches.map((ub) => ({
    branchId: ub.branchId,
    isPrimary: ub.isPrimary,
  }));

  const roles: UserRoleInfo[] = entity.userRoles.map((ur) => ({
    roleId: ur.roleId,
    roleCode: ur.role.code,
    branchId: ur.branchId,
  }));

  const permissionsSet = new Set<string>();
  for (const userRole of entity.userRoles) {
    for (const rp of userRole.role.rolePermissions) {
      permissionsSet.add(rp.permission.code);
    }
  }

  return {
    ...toAuthUser(entity),
    branches,
    roles,
    permissions: Array.from(permissionsSet),
  };
}

export function sanitizeUserForResponse(user: AuthUser): Omit<AuthUser, 'passwordChangedAt'> & { passwordChangedAt?: never } {
  const { passwordChangedAt, ...sanitized } = user;
  void passwordChangedAt;
  return sanitized;
}
