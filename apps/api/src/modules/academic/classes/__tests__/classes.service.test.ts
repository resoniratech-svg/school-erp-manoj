/**
 * Classes Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ClassesService } from '../classes.service';
import type { ClassesRepository } from '../classes.repository';

describe('ClassesService', () => {
    let service: ClassesService;
    let mockRepository: {
        findById: Mock;
        findByIdWithRelations: Mock;
        findByCode: Mock;
        findMany: Mock;
        create: Mock;
        update: Mock;
        softDelete: Mock;
        hasDependencies: Mock;
        findAcademicYearById: Mock;
        findBranchById: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockClass = {
        id: 'class-1',
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        academicYearId: 'year-1',
        name: 'Class 1',
        code: 'C1',
        displayOrder: 1,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    const mockAcademicYear = {
        id: 'year-1',
        name: '2024-2025',
        tenantId: 'tenant-123',
    };

    const mockBranch = {
        id: 'branch-456',
        name: 'Main Branch',
        tenantId: 'tenant-123',
    };

    beforeEach(() => {
        mockRepository = {
            findById: vi.fn(),
            findByIdWithRelations: vi.fn(),
            findByCode: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            softDelete: vi.fn(),
            hasDependencies: vi.fn(),
            findAcademicYearById: vi.fn(),
            findBranchById: vi.fn(),
        };

        service = new ClassesService(mockRepository as unknown as ClassesRepository);
    });

    describe('createClass', () => {
        it('should create class successfully', async () => {
            // Arrange
            const input = {
                name: 'Class 1',
                code: 'C1',
                displayOrder: 1,
                branchId: 'branch-456',
                academicYearId: 'year-1',
            };
            mockRepository.findBranchById.mockResolvedValue(mockBranch);
            mockRepository.findAcademicYearById.mockResolvedValue(mockAcademicYear);
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(mockClass);

            // Act
            const result = await service.createClass(input, mockContext);

            // Assert
            expect(mockRepository.create).toHaveBeenCalled();
            expect(result.name).toBe('Class 1');
            expect(result.code).toBe('C1');
        });

        it('should prevent duplicate code in same branch + academic year', async () => {
            // Arrange
            const input = {
                name: 'Class 1',
                code: 'C1',
                displayOrder: 1,
                branchId: 'branch-456',
                academicYearId: 'year-1',
            };
            mockRepository.findBranchById.mockResolvedValue(mockBranch);
            mockRepository.findAcademicYearById.mockResolvedValue(mockAcademicYear);
            mockRepository.findByCode.mockResolvedValue(mockClass);

            // Act & Assert
            await expect(service.createClass(input, mockContext)).rejects.toThrow(
                'A class with this code already exists in this branch and academic year'
            );
        });

        it('should deny access to non-existent academic year', async () => {
            // Arrange
            const input = {
                name: 'Class 1',
                code: 'C1',
                displayOrder: 1,
                branchId: 'branch-456',
                academicYearId: 'non-existent-year',
            };
            mockRepository.findBranchById.mockResolvedValue(mockBranch);
            mockRepository.findAcademicYearById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.createClass(input, mockContext)).rejects.toThrow(
                'Academic year not found'
            );
        });
    });

    describe('deleteClass', () => {
        it('should soft delete class without dependencies', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockClass);
            mockRepository.hasDependencies.mockResolvedValue(false);
            mockRepository.softDelete.mockResolvedValue(mockClass);

            // Act
            await service.deleteClass(mockClass.id, mockContext);

            // Assert
            expect(mockRepository.softDelete).toHaveBeenCalledWith(mockClass.id);
        });

        it('should hide soft-deleted class from queries (findById returns null for deleted)', async () => {
            // Arrange - findById filters by deletedAt: null
            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.deleteClass('deleted-class-id', mockContext)).rejects.toThrow(
                'Class not found'
            );
        });

        it('should prevent deletion when class has dependencies', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockClass);
            mockRepository.hasDependencies.mockResolvedValue(true);

            // Act & Assert
            await expect(service.deleteClass(mockClass.id, mockContext)).rejects.toThrow(
                'Cannot delete class with existing sections or enrollments'
            );
        });
    });

    describe('getClassById', () => {
        it('should return class for valid tenant + branch', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockClass);

            // Act
            const result = await service.getClassById(mockClass.id, mockContext);

            // Assert
            expect(result.id).toBe(mockClass.id);
            expect(mockRepository.findById).toHaveBeenCalledWith(
                mockClass.id,
                mockContext.tenantId,
                mockContext.branchId
            );
        });

        it('should deny cross-tenant access', async () => {
            // Arrange - findById with wrong tenant returns null
            mockRepository.findById.mockResolvedValue(null);

            const wrongContext = {
                ...mockContext,
                tenantId: 'other-tenant',
            };

            // Act & Assert
            await expect(service.getClassById(mockClass.id, wrongContext)).rejects.toThrow(
                'Class not found'
            );
        });
    });
});
