import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '@school-erp/shared';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { USER_ERROR_CODES } from '../users.constants';

vi.mock('argon2', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
}));

const mockUser = {
  id: 'user-123',
  tenantId: 'tenant-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: null,
  avatarUrl: null,
  userType: 'admin' as const,
  status: 'active' as const,
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserWithRelations = {
  ...mockUser,
  userBranches: [
    {
      id: 'ub-123',
      branchId: 'branch-123',
      isPrimary: true,
      branch: { id: 'branch-123', name: 'Main Branch', code: 'MAIN' },
    },
  ],
  userRoles: [
    {
      id: 'ur-123',
      roleId: 'role-123',
      branchId: null,
      role: { id: 'role-123', code: 'ADMIN', name: 'Admin' },
      branch: null,
    },
  ],
};

const mockContext = {
  tenantId: 'tenant-123',
  userId: 'current-user-123',
};

describe('UsersService', () => {
  let usersService: UsersService;
  let mockRepository: Partial<UsersRepository>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      findById: vi.fn(),
      findByIdWithRelations: vi.fn(),
      findByEmail: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      assignBranch: vi.fn(),
      removeBranch: vi.fn(),
      getUserBranches: vi.fn(),
      assignRole: vi.fn(),
      removeRole: vi.fn(),
      getUserRoles: vi.fn(),
      countAdminUsers: vi.fn(),
      findRoleById: vi.fn(),
      findBranchById: vi.fn(),
      countUserRoleAssignments: vi.fn(),
    };

    usersService = new UsersService(mockRepository as UsersRepository);
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      (mockRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (mockRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (mockRepository.findByIdWithRelations as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserWithRelations);

      const result = await usersService.createUser(
        {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          userType: 'admin',
        },
        mockContext
      );

      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError if email exists', async () => {
      (mockRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      await expect(
        usersService.createUser(
          {
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            userType: 'admin',
          },
          mockContext
        )
      ).rejects.toThrow(ConflictError);
    });

    it('should validate branch IDs when provided', async () => {
      (mockRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (mockRepository.findBranchById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        usersService.createUser(
          {
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            userType: 'admin',
            branchIds: ['invalid-branch'],
          },
          mockContext
        )
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getUserById', () => {
    it('should return user with relations', async () => {
      (mockRepository.findByIdWithRelations as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserWithRelations);

      const result = await usersService.getUserById('user-123', mockContext);

      expect(result.id).toBe('user-123');
      expect(result.branches).toHaveLength(1);
      expect(result.roles).toHaveLength(1);
    });

    it('should throw NotFoundError if user not found', async () => {
      (mockRepository.findByIdWithRelations as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(usersService.getUserById('invalid-user', mockContext)).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user', async () => {
      (mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (mockRepository.countAdminUsers as ReturnType<typeof vi.fn>).mockResolvedValue(2);
      (mockRepository.softDelete as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      await expect(usersService.deleteUser('user-123', mockContext)).resolves.toBeUndefined();
      expect(mockRepository.softDelete).toHaveBeenCalledWith('user-123', 'tenant-123');
    });

    it('should throw BadRequestError when deleting self', async () => {
      await expect(
        usersService.deleteUser('current-user-123', mockContext)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when deleting last admin', async () => {
      const adminUser = { ...mockUser, userType: 'admin' as const };
      (mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(adminUser);
      (mockRepository.countAdminUsers as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      await expect(usersService.deleteUser('user-123', mockContext)).rejects.toThrow(BadRequestError);
    });
  });

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      (mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (mockRepository.findRoleById as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'role-123',
        code: 'ADMIN',
        isSystem: false,
      });
      (mockRepository.assignRole as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await expect(
        usersService.assignRole('user-123', 'role-123', undefined, mockContext)
      ).resolves.toBeUndefined();
    });

    it('should throw NotFoundError for invalid role', async () => {
      (mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (mockRepository.findRoleById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        usersService.assignRole('user-123', 'invalid-role', undefined, mockContext)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
