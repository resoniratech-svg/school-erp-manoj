import { db } from '@school-erp/database';
import type { Prisma } from '@school-erp/database';
import type { UserListFilters } from './users.types';

const userSelectFields = {
  id: true,
  tenantId: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  userType: true,
  status: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const userWithRelationsSelect = {
  ...userSelectFields,
  userBranches: {
    select: {
      id: true,
      branchId: true,
      isPrimary: true,
      branch: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  },
  userRoles: {
    select: {
      id: true,
      roleId: true,
      branchId: true,
      role: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

export class UsersRepository {
  async findById(id: string, tenantId: string) {
    return db.user.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: userSelectFields,
    });
  }

  async findByIdWithRelations(id: string, tenantId: string) {
    return db.user.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: userWithRelationsSelect,
    });
  }

  async findByEmail(email: string, tenantId: string) {
    return db.user.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId,
        deletedAt: null,
      },
      select: userSelectFields,
    });
  }

  async findMany(
    tenantId: string,
    options: {
      skip: number;
      take: number;
      orderBy: Prisma.UserOrderByWithRelationInput;
      filters?: UserListFilters;
    }
  ) {
    const where: Prisma.UserWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (options.filters?.status) {
      where.status = options.filters.status;
    }

    if (options.filters?.userType) {
      where.userType = options.filters.userType;
    }

    if (options.filters?.branchId) {
      where.userBranches = {
        some: {
          branchId: options.filters.branchId,
        },
      };
    }

    if (options.filters?.search) {
      where.OR = [
        { email: { contains: options.filters.search, mode: 'insensitive' } },
        { firstName: { contains: options.filters.search, mode: 'insensitive' } },
        { lastName: { contains: options.filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: userSelectFields,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy,
      }),
      db.user.count({ where }),
    ]);

    return { users, total };
  }

  async create(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    userType: string;
    status: string;
  }) {
    return db.user.create({
      data: {
        tenantId: data.tenantId,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userType: data.userType as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: data.status as any,
      },
      select: userSelectFields,
    });
  }

  async update(id: string, tenantId: string, data: Prisma.UserUpdateInput) {
    return db.user.update({
      where: { id },
      data,
      select: userSelectFields,
    });
  }

  async softDelete(id: string, tenantId: string) {
    return db.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: userSelectFields,
    });
  }

  async assignBranch(userId: string, branchId: string, isPrimary: boolean) {
    if (isPrimary) {
      await db.userBranch.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    return db.userBranch.upsert({
      where: {
        userId_branchId: { userId, branchId },
      },
      create: {
        userId,
        branchId,
        isPrimary,
      },
      update: {
        isPrimary,
      },
    });
  }

  async removeBranch(userId: string, branchId: string) {
    return db.userBranch.delete({
      where: {
        userId_branchId: { userId, branchId },
      },
    });
  }

  async getUserBranches(userId: string) {
    return db.userBranch.findMany({
      where: { userId },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
      },
    });
  }

  async assignRole(userId: string, roleId: string, branchId: string | null, createdBy: string) {
    return db.userRole.upsert({
      where: {
        userId_roleId_branchId: { userId, roleId, branchId },
      },
      create: {
        userId,
        roleId,
        branchId,
        createdBy,
      },
      update: {},
    });
  }

  async removeRole(userId: string, roleId: string, branchId: string | null) {
    return db.userRole.deleteMany({
      where: {
        userId,
        roleId,
        branchId,
      },
    });
  }

  async getUserRoles(userId: string) {
    return db.userRole.findMany({
      where: { userId },
      include: {
        role: {
          select: {
            id: true,
            code: true,
            name: true,
            isSystem: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async countAdminUsers(tenantId: string) {
    return db.user.count({
      where: {
        tenantId,
        userType: 'admin',
        status: 'active',
        deletedAt: null,
      },
    });
  }

  async findRoleById(roleId: string, tenantId: string) {
    return db.role.findFirst({
      where: {
        id: roleId,
        OR: [
          { tenantId },
          { tenantId: null, isSystem: true },
        ],
        deletedAt: null,
      },
    });
  }

  async findBranchById(branchId: string, tenantId: string) {
    return db.branch.findFirst({
      where: {
        id: branchId,
        tenantId,
        deletedAt: null,
      },
    });
  }

  async countUserRoleAssignments(userId: string, roleCode: string) {
    return db.userRole.count({
      where: {
        userId,
        role: {
          code: roleCode,
        },
      },
    });
  }
}

export const usersRepository = new UsersRepository();
