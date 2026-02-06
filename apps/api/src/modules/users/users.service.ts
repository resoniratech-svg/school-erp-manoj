import crypto from 'crypto';
import * as argon2 from 'argon2';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '@school-erp/shared';
import { usersRepository, UsersRepository } from './users.repository';
import {
  toUserResponse,
  toUserDetailResponse,
  toUserResponseList,
} from './users.mapper';
import { USER_ERROR_CODES, DEFAULT_PASSWORD_LENGTH } from './users.constants';
import type {
  CreateUserInput,
  UpdateUserInput,
  UserListOptions,
  UserResponse,
  UserDetailResponse,
  PaginatedUsersResponse,
  UserContext,
} from './users.types';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

export class UsersService {
  constructor(private readonly repository: UsersRepository = usersRepository) {}

  async createUser(
    input: CreateUserInput,
    context: UserContext
  ): Promise<UserDetailResponse> {
    const existingUser = await this.repository.findByEmail(input.email, context.tenantId);
    if (existingUser) {
      throw new ConflictError('User with this email already exists', {
        code: USER_ERROR_CODES.EMAIL_ALREADY_EXISTS,
      });
    }

    if (input.branchIds?.length) {
      for (const branchId of input.branchIds) {
        const branch = await this.repository.findBranchById(branchId, context.tenantId);
        if (!branch) {
          throw new BadRequestError('Invalid branch ID', {
            code: USER_ERROR_CODES.INVALID_BRANCH_ASSIGNMENT,
            branchId,
          });
        }
      }
    }

    const temporaryPassword = this.generateSecurePassword();
    const passwordHash = await this.hashPassword(temporaryPassword);

    const user = await this.repository.create({
      tenantId: context.tenantId,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      userType: input.userType,
      status: 'pending',
    });

    if (input.branchIds?.length) {
      for (const branchId of input.branchIds) {
        const isPrimary = branchId === input.primaryBranchId || 
          (input.branchIds.length === 1 && !input.primaryBranchId);
        await this.repository.assignBranch(user.id, branchId, isPrimary);
      }
    }

    logger.info('User created', {
      userId: user.id,
      tenantId: context.tenantId,
      createdBy: context.userId,
    });

    const userWithRelations = await this.repository.findByIdWithRelations(user.id, context.tenantId);
    return toUserDetailResponse(userWithRelations!);
  }

  async getUserById(
    userId: string,
    context: UserContext
  ): Promise<UserDetailResponse> {
    const user = await this.repository.findByIdWithRelations(userId, context.tenantId);
    if (!user) {
      throw new NotFoundError('User not found', {
        code: USER_ERROR_CODES.USER_NOT_FOUND,
      });
    }

    return toUserDetailResponse(user);
  }

  async listUsers(
    options: UserListOptions,
    context: UserContext
  ): Promise<PaginatedUsersResponse> {
    const skip = (options.page - 1) * options.limit;
    const orderBy = { [options.sortBy || 'createdAt']: options.sortOrder || 'desc' };

    const { users, total } = await this.repository.findMany(context.tenantId, {
      skip,
      take: options.limit,
      orderBy,
      filters: options.filters,
    });

    return {
      users: toUserResponseList(users),
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async updateUser(
    userId: string,
    input: UpdateUserInput,
    context: UserContext
  ): Promise<UserResponse> {
    const existingUser = await this.repository.findById(userId, context.tenantId);
    if (!existingUser) {
      throw new NotFoundError('User not found', {
        code: USER_ERROR_CODES.USER_NOT_FOUND,
      });
    }

    if (input.email && input.email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const userWithEmail = await this.repository.findByEmail(input.email, context.tenantId);
      if (userWithEmail && userWithEmail.id !== userId) {
        throw new ConflictError('Email already in use', {
          code: USER_ERROR_CODES.EMAIL_ALREADY_EXISTS,
        });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (input.email) updateData.email = input.email.toLowerCase();
    if (input.firstName) updateData.firstName = input.firstName;
    if (input.lastName) updateData.lastName = input.lastName;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl;
    if (input.userType) updateData.userType = input.userType;
    if (input.status) updateData.status = input.status;

    const updatedUser = await this.repository.update(userId, context.tenantId, updateData);

    logger.info('User updated', {
      userId,
      tenantId: context.tenantId,
      updatedBy: context.userId,
    });

    return toUserResponse(updatedUser);
  }

  async deleteUser(
    userId: string,
    context: UserContext
  ): Promise<void> {
    if (userId === context.userId) {
      throw new BadRequestError('Cannot delete your own account', {
        code: USER_ERROR_CODES.CANNOT_DELETE_SELF,
      });
    }

    const user = await this.repository.findById(userId, context.tenantId);
    if (!user) {
      throw new NotFoundError('User not found', {
        code: USER_ERROR_CODES.USER_NOT_FOUND,
      });
    }

    if (user.userType === 'admin') {
      const adminCount = await this.repository.countAdminUsers(context.tenantId);
      if (adminCount <= 1) {
        throw new BadRequestError('Cannot delete the last admin user', {
          code: USER_ERROR_CODES.CANNOT_DELETE_LAST_ADMIN,
        });
      }
    }

    await this.repository.softDelete(userId, context.tenantId);

    logger.info('User deleted', {
      userId,
      tenantId: context.tenantId,
      deletedBy: context.userId,
    });
  }

  async assignRole(
    userId: string,
    roleId: string,
    branchId: string | undefined,
    context: UserContext
  ): Promise<void> {
    const user = await this.repository.findById(userId, context.tenantId);
    if (!user) {
      throw new NotFoundError('User not found', {
        code: USER_ERROR_CODES.USER_NOT_FOUND,
      });
    }

    const role = await this.repository.findRoleById(roleId, context.tenantId);
    if (!role) {
      throw new NotFoundError('Role not found', {
        code: USER_ERROR_CODES.ROLE_NOT_FOUND,
      });
    }

    if (branchId) {
      const branch = await this.repository.findBranchById(branchId, context.tenantId);
      if (!branch) {
        throw new BadRequestError('Invalid branch', {
          code: USER_ERROR_CODES.INVALID_BRANCH_ASSIGNMENT,
        });
      }
    }

    await this.repository.assignRole(userId, roleId, branchId ?? null, context.userId);

    logger.info('Role assigned to user', {
      userId,
      roleId,
      branchId,
      tenantId: context.tenantId,
      assignedBy: context.userId,
    });
  }

  async removeRole(
    userId: string,
    roleId: string,
    context: UserContext
  ): Promise<void> {
    const user = await this.repository.findById(userId, context.tenantId);
    if (!user) {
      throw new NotFoundError('User not found', {
        code: USER_ERROR_CODES.USER_NOT_FOUND,
      });
    }

    const role = await this.repository.findRoleById(roleId, context.tenantId);
    if (!role) {
      throw new NotFoundError('Role not found', {
        code: USER_ERROR_CODES.ROLE_NOT_FOUND,
      });
    }

    if (role.isSystem && role.code === 'SUPER_ADMIN') {
      const adminRoleCount = await this.repository.countUserRoleAssignments(userId, 'SUPER_ADMIN');
      if (adminRoleCount <= 1 && userId === context.userId) {
        throw new BadRequestError('Cannot remove your own admin role', {
          code: USER_ERROR_CODES.CANNOT_REMOVE_LAST_ADMIN_ROLE,
        });
      }
    }

    await this.repository.removeRole(userId, roleId, null);

    logger.info('Role removed from user', {
      userId,
      roleId,
      tenantId: context.tenantId,
      removedBy: context.userId,
    });
  }

  async assignBranch(
    userId: string,
    branchId: string,
    isPrimary: boolean,
    context: UserContext
  ): Promise<void> {
    const user = await this.repository.findById(userId, context.tenantId);
    if (!user) {
      throw new NotFoundError('User not found', {
        code: USER_ERROR_CODES.USER_NOT_FOUND,
      });
    }

    const branch = await this.repository.findBranchById(branchId, context.tenantId);
    if (!branch) {
      throw new BadRequestError('Invalid branch', {
        code: USER_ERROR_CODES.INVALID_BRANCH_ASSIGNMENT,
      });
    }

    await this.repository.assignBranch(userId, branchId, isPrimary);

    logger.info('Branch assigned to user', {
      userId,
      branchId,
      isPrimary,
      tenantId: context.tenantId,
      assignedBy: context.userId,
    });
  }

  async removeBranch(
    userId: string,
    branchId: string,
    context: UserContext
  ): Promise<void> {
    const user = await this.repository.findById(userId, context.tenantId);
    if (!user) {
      throw new NotFoundError('User not found', {
        code: USER_ERROR_CODES.USER_NOT_FOUND,
      });
    }

    const userBranches = await this.repository.getUserBranches(userId);
    if (userBranches.length <= 1) {
      throw new BadRequestError('User must have at least one branch', {
        code: USER_ERROR_CODES.INVALID_BRANCH_ASSIGNMENT,
      });
    }

    await this.repository.removeBranch(userId, branchId);

    const removedBranch = userBranches.find(ub => ub.branchId === branchId);
    if (removedBranch?.isPrimary) {
      const remainingBranch = userBranches.find(ub => ub.branchId !== branchId);
      if (remainingBranch) {
        await this.repository.assignBranch(userId, remainingBranch.branchId, true);
      }
    }

    logger.info('Branch removed from user', {
      userId,
      branchId,
      tenantId: context.tenantId,
      removedBy: context.userId,
    });
  }

  private generateSecurePassword(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const bytes = crypto.randomBytes(DEFAULT_PASSWORD_LENGTH);
    let password = '';
    for (let i = 0; i < DEFAULT_PASSWORD_LENGTH; i++) {
      password += chars[bytes[i] % chars.length];
    }
    return password;
  }

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }
}

export const usersService = new UsersService();
