import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '@school-erp/shared';
import { rolesRepository, RolesRepository } from './roles.repository';
import { ROLE_ERROR_CODES } from './roles.constants';
import type {
  CreateRoleInput,
  UpdateRoleInput,
  RoleListOptions,
  RoleResponse,
  RoleDetailResponse,
  PaginatedRolesResponse,
  PermissionResponse,
  RoleContext,
} from './roles.types';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

function toRoleResponse(entity: {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}): RoleResponse {
  return {
    id: entity.id,
    code: entity.code,
    name: entity.name,
    description: entity.description,
    isSystem: entity.isSystem,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function toRoleDetailResponse(
  entity: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
    rolePermissions: {
      permission: {
        id: string;
        code: string;
        name: string;
        resource: string;
        action: string;
        scope: string | null;
      };
    }[];
  }
): RoleDetailResponse {
  return {
    ...toRoleResponse(entity),
    permissions: entity.rolePermissions.map((rp) => rp.permission),
  };
}

export class RolesService {
  constructor(private readonly repository: RolesRepository = rolesRepository) {}

  async createRole(
    input: CreateRoleInput,
    context: RoleContext
  ): Promise<RoleDetailResponse> {
    const existingRole = await this.repository.findByCode(input.code, context.tenantId);
    if (existingRole) {
      throw new ConflictError('Role with this code already exists', {
        code: ROLE_ERROR_CODES.ROLE_ALREADY_EXISTS,
      });
    }

    if (input.permissionIds?.length) {
      await this.validatePermissions(input.permissionIds, context.userPermissions);
    }

    const role = await this.repository.create({
      tenantId: context.tenantId,
      code: input.code,
      name: input.name,
      description: input.description,
    });

    if (input.permissionIds?.length) {
      await this.repository.setPermissions(role.id, input.permissionIds);
    }

    logger.info('Role created', {
      roleId: role.id,
      tenantId: context.tenantId,
      createdBy: context.userId,
    });

    const roleWithPermissions = await this.repository.findByIdWithPermissions(role.id, context.tenantId);
    return toRoleDetailResponse(roleWithPermissions!);
  }

  async getRoleById(
    roleId: string,
    context: RoleContext
  ): Promise<RoleDetailResponse> {
    const role = await this.repository.findByIdWithPermissions(roleId, context.tenantId);
    if (!role) {
      throw new NotFoundError('Role not found', {
        code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
      });
    }

    return toRoleDetailResponse(role);
  }

  async listRoles(
    options: RoleListOptions,
    context: RoleContext
  ): Promise<PaginatedRolesResponse> {
    const skip = (options.page - 1) * options.limit;
    const orderBy = { [options.sortBy || 'name']: options.sortOrder || 'asc' };

    const { roles, total } = await this.repository.findMany(context.tenantId, {
      skip,
      take: options.limit,
      orderBy,
      filters: options.filters,
    });

    return {
      roles: roles.map(toRoleResponse),
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async updateRole(
    roleId: string,
    input: UpdateRoleInput,
    context: RoleContext
  ): Promise<RoleDetailResponse> {
    const role = await this.repository.findById(roleId, context.tenantId);
    if (!role) {
      throw new NotFoundError('Role not found', {
        code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
      });
    }

    if (role.isSystem) {
      throw new ForbiddenError('Cannot update system role', {
        code: ROLE_ERROR_CODES.CANNOT_UPDATE_SYSTEM_ROLE,
      });
    }

    if (input.permissionIds) {
      await this.validatePermissions(input.permissionIds, context.userPermissions);
    }

    const updateData: Record<string, unknown> = {};
    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    if (Object.keys(updateData).length > 0) {
      await this.repository.update(roleId, updateData);
    }

    if (input.permissionIds) {
      await this.repository.setPermissions(roleId, input.permissionIds);
    }

    logger.info('Role updated', {
      roleId,
      tenantId: context.tenantId,
      updatedBy: context.userId,
    });

    const updatedRole = await this.repository.findByIdWithPermissions(roleId, context.tenantId);
    return toRoleDetailResponse(updatedRole!);
  }

  async deleteRole(
    roleId: string,
    context: RoleContext
  ): Promise<void> {
    const role = await this.repository.findById(roleId, context.tenantId);
    if (!role) {
      throw new NotFoundError('Role not found', {
        code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
      });
    }

    if (role.isSystem) {
      throw new ForbiddenError('Cannot delete system role', {
        code: ROLE_ERROR_CODES.CANNOT_DELETE_SYSTEM_ROLE,
      });
    }

    const usersWithRole = await this.repository.countUsersWithRole(roleId);
    if (usersWithRole > 0) {
      throw new BadRequestError('Cannot delete role that is assigned to users', {
        code: ROLE_ERROR_CODES.ROLE_IN_USE,
        usersCount: usersWithRole,
      });
    }

    await this.repository.softDelete(roleId);

    logger.info('Role deleted', {
      roleId,
      tenantId: context.tenantId,
      deletedBy: context.userId,
    });
  }

  async getAllPermissions(): Promise<PermissionResponse[]> {
    return this.repository.findAllPermissions();
  }

  private async validatePermissions(
    permissionIds: string[],
    userPermissions: ReadonlySet<string>
  ): Promise<void> {
    const permissions = await this.repository.findPermissionsByIds(permissionIds);

    if (permissions.length !== permissionIds.length) {
      const foundIds = new Set(permissions.map((p) => p.id));
      const invalidIds = permissionIds.filter((id) => !foundIds.has(id));
      throw new BadRequestError('Invalid permission IDs', {
        code: ROLE_ERROR_CODES.INVALID_PERMISSION,
        invalidIds,
      });
    }

    for (const permission of permissions) {
      if (!userPermissions.has(permission.code) && !userPermissions.has('*')) {
        throw new ForbiddenError('Cannot assign permission you do not have', {
          code: ROLE_ERROR_CODES.PRIVILEGE_ESCALATION,
          permissionCode: permission.code,
        });
      }
    }
  }
}

export const rolesService = new RolesService();
