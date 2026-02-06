import type {
  UserResponse,
  UserDetailResponse,
  UserBranchResponse,
  UserRoleResponse,
} from './users.types';

type UserEntity = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  userType: string;
  status: string;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserWithRelationsEntity = UserEntity & {
  userBranches: {
    id: string;
    branchId: string;
    isPrimary: boolean;
    branch: {
      id: string;
      name: string;
      code: string;
    };
  }[];
  userRoles: {
    id: string;
    roleId: string;
    branchId: string | null;
    role: {
      id: string;
      code: string;
      name: string;
    };
    branch: {
      id: string;
      name: string;
    } | null;
  }[];
};

export function toUserResponse(entity: UserEntity): UserResponse {
  return {
    id: entity.id,
    email: entity.email,
    firstName: entity.firstName,
    lastName: entity.lastName,
    phone: entity.phone,
    avatarUrl: entity.avatarUrl,
    userType: entity.userType as UserResponse['userType'],
    status: entity.status as UserResponse['status'],
    emailVerifiedAt: entity.emailVerifiedAt,
    lastLoginAt: entity.lastLoginAt,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export function toUserBranchResponse(entity: {
  id: string;
  branchId: string;
  isPrimary: boolean;
  branch: { id: string; name: string; code: string };
}): UserBranchResponse {
  return {
    id: entity.id,
    branchId: entity.branchId,
    branchName: entity.branch.name,
    branchCode: entity.branch.code,
    isPrimary: entity.isPrimary,
  };
}

export function toUserRoleResponse(entity: {
  id: string;
  roleId: string;
  branchId: string | null;
  role: { id: string; code: string; name: string };
  branch: { id: string; name: string } | null;
}): UserRoleResponse {
  return {
    id: entity.id,
    roleId: entity.roleId,
    roleCode: entity.role.code,
    roleName: entity.role.name,
    branchId: entity.branchId,
    branchName: entity.branch?.name ?? null,
  };
}

export function toUserDetailResponse(entity: UserWithRelationsEntity): UserDetailResponse {
  return {
    ...toUserResponse(entity),
    branches: entity.userBranches.map(toUserBranchResponse),
    roles: entity.userRoles.map(toUserRoleResponse),
  };
}

export function toUserResponseList(entities: UserEntity[]): UserResponse[] {
  return entities.map(toUserResponse);
}
