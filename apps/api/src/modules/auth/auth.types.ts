import type { UserStatus, UserType } from '@school-erp/database';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  userType: UserType;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SessionInfo {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  userType: UserType;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
}

export interface AuthUserWithPassword extends AuthUser {
  passwordHash: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: TokenPair;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  tokens: TokenPair;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SessionContext {
  userId: string;
  tenantId: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

export interface UserBranchInfo {
  branchId: string;
  isPrimary: boolean;
}

export interface UserRoleInfo {
  roleId: string;
  roleCode: string;
  branchId: string | null;
}

export interface AuthenticatedUser extends AuthUser {
  branches: UserBranchInfo[];
  roles: UserRoleInfo[];
  permissions: string[];
}
