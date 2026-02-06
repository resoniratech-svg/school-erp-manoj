/**
 * Sections Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { SectionsService } from '../sections.service';
import type { SectionsRepository } from '../sections.repository';

describe('SectionsService', () => {
    let service: SectionsService;
    let mockRepository: {
        findById: Mock;
        findByCode: Mock;
        findMany: Mock;
        create: Mock;
        update: Mock;
        softDelete: Mock;
        hasDependencies: Mock;
        findClassById: Mock;
        findStaffById: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockClass = {
        id: 'class-1',
        name: 'Class 1',
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        academicYearId: 'year-1',
    };

    const mockSection = {
        id: 'section-1',
        classId: 'class-1',
        name: 'Section A',
        code: 'A',
        capacity: 30,
        room: 'Room 101',
        classTeacherId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        class: mockClass,
        classTeacher: null,
    };

    const mockStaff = {
        id: 'staff-1',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: 'tenant-123',
        status: 'active',
    };

    beforeEach(() => {
        mockRepository = {
            findById: vi.fn(),
            findByCode: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            softDelete: vi.fn(),
            hasDependencies: vi.fn(),
            findClassById: vi.fn(),
            findStaffById: vi.fn(),
        };

        service = new SectionsService(mockRepository as unknown as SectionsRepository);
    });

    describe('createSection', () => {
        it('should create section successfully', async () => {
            // Arrange
            const input = {
                name: 'Section A',
                code: 'A',
                classId: 'class-1',
                capacity: 30,
            };
            mockRepository.findClassById.mockResolvedValue(mockClass);
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(mockSection);

            // Act
            const result = await service.createSection(input, mockContext);

            // Assert
            expect(mockRepository.create).toHaveBeenCalled();
            expect(result.name).toBe('Section A');
            expect(result.code).toBe('A');
        });

        it('should prevent duplicate section code within same class', async () => {
            // Arrange
            const input = {
                name: 'Section A',
                code: 'A',
                classId: 'class-1',
            };
            mockRepository.findClassById.mockResolvedValue(mockClass);
            mockRepository.findByCode.mockResolvedValue(mockSection);

            // Act & Assert
            await expect(service.createSection(input, mockContext)).rejects.toThrow(
                'A section with this code already exists in this class'
            );
        });
    });

    describe('assignClassTeacher', () => {
        it('should assign valid staff as class teacher', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockSection);
            mockRepository.findStaffById.mockResolvedValue(mockStaff);
            mockRepository.update.mockResolvedValue({
                ...mockSection,
                classTeacherId: 'staff-1',
            });

            // Act
            const result = await service.assignClassTeacher(
                mockSection.id,
                { classTeacherId: 'staff-1' },
                mockContext
            );

            // Assert
            expect(mockRepository.update).toHaveBeenCalledWith(mockSection.id, {
                classTeacherId: 'staff-1',
            });
            expect(result.classTeacherId).toBe('staff-1');
        });

        it('should reject invalid staff assignment', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockSection);
            mockRepository.findStaffById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.assignClassTeacher(
                    mockSection.id,
                    { classTeacherId: 'invalid-staff' },
                    mockContext
                )
            ).rejects.toThrow('Staff not found');
        });

        it('should reject cross-tenant staff assignment', async () => {
            // Arrange - staff from different tenant returns null due to tenant filter
            mockRepository.findById.mockResolvedValue(mockSection);
            mockRepository.findStaffById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.assignClassTeacher(
                    mockSection.id,
                    { classTeacherId: 'other-tenant-staff' },
                    mockContext
                )
            ).rejects.toThrow('Staff not found');
        });

        it('should reject inactive staff', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockSection);
            mockRepository.findStaffById.mockResolvedValue({
                ...mockStaff,
                status: 'inactive',
            });

            // Act & Assert
            await expect(
                service.assignClassTeacher(
                    mockSection.id,
                    { classTeacherId: 'staff-1' },
                    mockContext
                )
            ).rejects.toThrow('Staff is not active');
        });
    });

    describe('deleteSection', () => {
        it('should soft delete section without dependencies', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockSection);
            mockRepository.hasDependencies.mockResolvedValue(false);
            mockRepository.softDelete.mockResolvedValue(mockSection);

            // Act
            await service.deleteSection(mockSection.id, mockContext);

            // Assert
            expect(mockRepository.softDelete).toHaveBeenCalledWith(mockSection.id);
        });

        it('should hide soft-deleted section from queries', async () => {
            // Arrange - findById filters by deletedAt: null
            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.deleteSection('deleted-section-id', mockContext)).rejects.toThrow(
                'Section not found'
            );
        });

        it('should prevent deletion when section has dependencies', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockSection);
            mockRepository.hasDependencies.mockResolvedValue(true);

            // Act & Assert
            await expect(service.deleteSection(mockSection.id, mockContext)).rejects.toThrow(
                'Cannot delete section with existing enrollments or timetable entries'
            );
        });
    });
});
