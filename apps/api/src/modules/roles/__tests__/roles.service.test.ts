import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '@school-erp/shared';
import { RolesService } from '../roles.service';
import { RolesRepository } from '../roles.repository';
import { ROLE_ERROR_CODES } from '../roles.constants';

const mockRole = {
  id: 'role-123',
  tenantId: 'tenant-123',
  code: 'CUSTOM_ROLE',
  name: 'Custom Role',
  description: 'A custom role',
  isSystem: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSystemRole = {
  ...mockRole,
  id: 'system-role-123',
  code: 'SUPER_ADMIN',
  name: 'Super Admin',
  isSystem: true,
  tenantId: null,
};

const mockRoleWithPermissions = {
  ...mockRole,
  rolePermissions: [
    {
      permission: {
        id: 'perm-123',
        code: 'user:read:tenant',
        name: 'Read Users',
        resource: 'user',
        action: 'read',
        scope: 'tenant',
      },
    },
  ],
};

const mockContext = {
  tenantId: 'tenant-123',
  userId: 'user-123',
  userPermissions: new Set(['user:read:tenant', 'user:create:tenant', 'role:create:tenant', '*']),
};

describe('RolesService', () => {
  let rolesService: RolesService;
  let mockRepository: Partial<RolesRepository>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      findById: vi.fn(),
      findByIdWithPermissions: vi.fn(),
      findByCode: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      setPermissions: vi.fn(),
      getRolePermissions: vi.fn(),
      findAllPermissions: vi.fn(),
      findPermissionsByIds: vi.fn(),
      countUsersWithRole: vi.fn(),
    };

    rolesService = new RolesService(mockRepository as RolesRepository);
  });

  describe('createRole', () => {
    it('should create a role successfully', async () => {
      (mockRepository.findByCode as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (mockRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockRole);
      (mockRepository.findByIdWithPermissions as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoleWithPermissions);

      const result = await rolesService.createRole(
        {
          code: 'CUSTOM_ROLE',
          name: 'Custom Role',
        },
        mockContext
      );

      expect(result.code).toBe('CUSTOM_ROLE');
      expect(result.name).toBe('Custom Role');
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError if role code exists', async () => {
      (mockRepository.findByCode as ReturnType<typeof vi.fn>).mockResolvedValue(mockRole);

      await expect(
        rolesService.createRole(
          {
            code: 'CUSTOM_ROLE',
            name: 'Custom Role',
          },
          mockContext
        )
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteRole', () => {
    it('should soft delete a custom role', async () => {
      (mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockRole);
      (mockRepository.countUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (mockRepository.softDelete as ReturnType<typeof vi.fn>).mockResolvedValue(mockRole);

      await expect(rolesService.deleteRole('role-123', mockContext)).resolves.toBeUndefined();
      expect(mockRepository.softDelete).toHaveBeenCalledWith('role-123');
    });

    it('should throw ForbiddenError when deleting system role', async () => {
      (mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockSystemRole);

      await expect(rolesService.deleteRole('system-role-123', mockContext)).rejects.toThrow(ForbiddenError);
    });

    it('should throw BadRequestError when role is in use', async () => {
      (mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockRole);
      (mockRepository.countUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(5);

      await expect(rolesService.deleteRole('role-123', mockContext)).rejects.toThrow(BadRequestError);
    });
  });

  describe('updateRole', () => {
    it('should update a custom role', async () => {
      (mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockRole);
      (mockRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockRole);
      (mockRepository.findByIdWithPermissions as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoleWithPermissions);

      const result = await rolesService.updateRole(
        'role-123',
        { name: 'Updated Role' },
        mockContext
      );

      expect(result).toBeDefined();
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when updating system role', async () => {
      (mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockSystemRole);

      await expect(
        rolesService.updateRole('system-role-123', { name: 'Updated' }, mockContext)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('privilege escalation prevention', () => {
    it('should prevent assigning permissions user does not have', async () => {
      const limitedContext = {
        ...mockContext,
        userPermissions: new Set(['user:read:tenant']),
      };

      (mockRepository.findByCode as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (mockRepository.findPermissionsByIds as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'perm-456',
          code: 'user:delete:tenant',
          name: 'Delete Users',
          resource: 'user',
          action: 'delete',
          scope: 'tenant',
        },
      ]);

      await expect(
        rolesService.createRole(
          {
            code: 'CUSTOM_ROLE',
            name: 'Custom Role',
            permissionIds: ['perm-456'],
          },
          limitedContext
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
