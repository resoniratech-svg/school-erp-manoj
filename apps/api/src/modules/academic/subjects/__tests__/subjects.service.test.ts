/**
 * Subjects Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { SubjectsService } from '../subjects.service';
import type { SubjectsRepository } from '../subjects.repository';

describe('SubjectsService', () => {
    let service: SubjectsService;
    let mockRepository: {
        findById: Mock;
        findByCode: Mock;
        findByName: Mock;
        findMany: Mock;
        create: Mock;
        update: Mock;
        softDelete: Mock;
        hasDependencies: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        userId: 'user-789',
    };

    const mockSubject = {
        id: 'subject-1',
        tenantId: 'tenant-123',
        name: 'Mathematics',
        code: 'MATH',
        type: 'core',
        creditHours: 4,
        description: 'Core mathematics subject',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    beforeEach(() => {
        mockRepository = {
            findById: vi.fn(),
            findByCode: vi.fn(),
            findByName: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            softDelete: vi.fn(),
            hasDependencies: vi.fn(),
        };

        service = new SubjectsService(mockRepository as unknown as SubjectsRepository);
    });

    describe('createSubject', () => {
        it('should create subject successfully', async () => {
            // Arrange
            const input = {
                name: 'Mathematics',
                code: 'MATH',
                type: 'core' as const,
                creditHours: 4,
            };
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.findByName.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(mockSubject);

            // Act
            const result = await service.createSubject(input, mockContext);

            // Assert
            expect(mockRepository.create).toHaveBeenCalled();
            expect(result.name).toBe('Mathematics');
            expect(result.code).toBe('MATH');
            expect(result.type).toBe('core');
        });

        it('should prevent duplicate code per tenant', async () => {
            // Arrange
            const input = {
                name: 'Physics',
                code: 'MATH', // Duplicate code
                type: 'core' as const,
            };
            mockRepository.findByCode.mockResolvedValue(mockSubject);

            // Act & Assert
            await expect(service.createSubject(input, mockContext)).rejects.toThrow(
                'A subject with this code already exists'
            );
        });

        it('should prevent duplicate name per tenant', async () => {
            // Arrange
            const input = {
                name: 'Mathematics', // Duplicate name
                code: 'PHYS',
                type: 'core' as const,
            };
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.findByName.mockResolvedValue(mockSubject);

            // Act & Assert
            await expect(service.createSubject(input, mockContext)).rejects.toThrow(
                'A subject with this name already exists'
            );
        });
    });

    describe('listSubjects', () => {
        it('should filter by type', async () => {
            // Arrange
            mockRepository.findMany.mockResolvedValue({
                subjects: [mockSubject],
                total: 1,
            });

            // Act
            const result = await service.listSubjects(
                {
                    page: 1,
                    limit: 20,
                    filters: { type: 'core' },
                },
                mockContext
            );

            // Assert
            expect(mockRepository.findMany).toHaveBeenCalledWith(
                mockContext.tenantId,
                expect.objectContaining({
                    filters: { type: 'core' },
                })
            );
            expect(result.subjects).toHaveLength(1);
        });
    });

    describe('deleteSubject', () => {
        it('should soft delete subject without dependencies', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockSubject);
            mockRepository.hasDependencies.mockResolvedValue(false);
            mockRepository.softDelete.mockResolvedValue(mockSubject);

            // Act
            await service.deleteSubject(mockSubject.id, mockContext);

            // Assert
            expect(mockRepository.softDelete).toHaveBeenCalledWith(mockSubject.id);
        });

        it('should hide soft-deleted subject from queries', async () => {
            // Arrange - findById filters by deletedAt: null
            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.deleteSubject('deleted-subject-id', mockContext)).rejects.toThrow(
                'Subject not found'
            );
        });

        it('should prevent deletion when subject has dependencies', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockSubject);
            mockRepository.hasDependencies.mockResolvedValue(true);

            // Act & Assert
            await expect(service.deleteSubject(mockSubject.id, mockContext)).rejects.toThrow(
                'Cannot delete subject linked to classes'
            );
        });
    });

    describe('getSubjectById', () => {
        it('should return subject for valid tenant', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockSubject);

            // Act
            const result = await service.getSubjectById(mockSubject.id, mockContext);

            // Assert
            expect(result.id).toBe(mockSubject.id);
            expect(mockRepository.findById).toHaveBeenCalledWith(
                mockSubject.id,
                mockContext.tenantId
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
            await expect(service.getSubjectById(mockSubject.id, wrongContext)).rejects.toThrow(
                'Subject not found'
            );
        });
    });
});
