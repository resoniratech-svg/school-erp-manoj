import { db } from '@school-erp/database';
import type { Prisma } from '@school-erp/database';
import type { RoleListFilters } from './roles.types';

const roleSelectFields = {
  id: true,
  tenantId: true,
  code: true,
  name: true,
  description: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
} as const;

const roleWithPermissionsSelect = {
  ...roleSelectFields,
  rolePermissions: {
    select: {
      permission: {
        select: {
          id: true,
          code: true,
          name: true,
          resource: true,
          action: true,
          scope: true,
        },
      },
    },
  },
} as const;

export class RolesRepository {
  async findById(id: string, tenantId: string) {
    return db.role.findFirst({
      where: {
        id,
        OR: [
          { tenantId },
          { tenantId: null, isSystem: true },
        ],
        deletedAt: null,
      },
      select: roleSelectFields,
    });
  }

  async findByIdWithPermissions(id: string, tenantId: string) {
    return db.role.findFirst({
      where: {
        id,
        OR: [
          { tenantId },
          { tenantId: null, isSystem: true },
        ],
        deletedAt: null,
      },
      select: roleWithPermissionsSelect,
    });
  }

  async findByCode(code: string, tenantId: string) {
    return db.role.findFirst({
      where: {
        code,
        OR: [
          { tenantId },
          { tenantId: null, isSystem: true },
        ],
        deletedAt: null,
      },
      select: roleSelectFields,
    });
  }

  async findMany(
    tenantId: string,
    options: {
      skip: number;
      take: number;
      orderBy: Prisma.RoleOrderByWithRelationInput;
      filters?: RoleListFilters;
    }
  ) {
    const where: Prisma.RoleWhereInput = {
      OR: [
        { tenantId },
        { tenantId: null, isSystem: true },
      ],
      deletedAt: null,
    };

    if (options.filters?.search) {
      where.AND = [
        {
          OR: [
            { name: { contains: options.filters.search, mode: 'insensitive' } },
            { code: { contains: options.filters.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (options.filters?.isSystem !== undefined) {
      where.isSystem = options.filters.isSystem;
    }

    const [roles, total] = await Promise.all([
      db.role.findMany({
        where,
        select: roleSelectFields,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy,
      }),
      db.role.count({ where }),
    ]);

    return { roles, total };
  }

  async create(data: {
    tenantId: string;
    code: string;
    name: string;
    description?: string;
  }) {
    return db.role.create({
      data: {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        description: data.description,
        isSystem: false,
      },
      select: roleSelectFields,
    });
  }

  async update(id: string, data: Prisma.RoleUpdateInput) {
    return db.role.update({
      where: { id },
      data,
      select: roleSelectFields,
    });
  }

  async softDelete(id: string) {
    return db.role.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: roleSelectFields,
    });
  }

  async setPermissions(roleId: string, permissionIds: string[]) {
    await db.rolePermission.deleteMany({
      where: { roleId },
    });

    if (permissionIds.length > 0) {
      await db.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    }
  }

  async getRolePermissions(roleId: string) {
    return db.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: {
          select: {
            id: true,
            code: true,
            name: true,
            resource: true,
            action: true,
            scope: true,
          },
        },
      },
    });
  }

  async findAllPermissions() {
    return db.permission.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        resource: true,
        action: true,
        scope: true,
      },
    });
  }

  async findPermissionsByIds(ids: string[]) {
    return db.permission.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        code: true,
        name: true,
        resource: true,
        action: true,
        scope: true,
      },
    });
  }

  async countUsersWithRole(roleId: string) {
    return db.userRole.count({
      where: { roleId },
    });
  }
}

export const rolesRepository = new RolesRepository();
