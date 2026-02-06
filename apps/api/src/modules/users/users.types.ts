import type { UserType, UserStatus } from '@school-erp/database';

export interface UserListFilters {
  status?: UserStatus;
  userType?: UserType;
  branchId?: string;
  search?: string;
}

export interface UserListOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: UserListFilters;
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: UserType;
  branchIds?: string[];
  primaryBranchId?: string;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  userType?: UserType;
  status?: UserStatus;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  userType: UserType;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDetailResponse extends UserResponse {
  branches: UserBranchResponse[];
  roles: UserRoleResponse[];
}

export interface UserBranchResponse {
  id: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  isPrimary: boolean;
}

export interface UserRoleResponse {
  id: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  branchId: string | null;
  branchName: string | null;
}

export interface AssignRoleInput {
  roleId: string;
  branchId?: string;
}

export interface AssignBranchInput {
  branchId: string;
  isPrimary?: boolean;
}

export interface PaginatedUsersResponse {
  users: UserResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserContext {
  tenantId: string;
  userId: string;
  branchId?: string;
}
