/**
 * Academic Years Unit Tests
 * Tests for atomic activation and core functionality
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { AcademicYearsService } from '../academic-years.service';
import type { AcademicYearsRepository } from '../academic-years.repository';

describe('AcademicYearsService', () => {
    let service: AcademicYearsService;
    let mockRepository: {
        findById: Mock;
        findByName: Mock;
        findCurrent: Mock;
        findMany: Mock;
        create: Mock;
        update: Mock;
        activateAtomic: Mock;
        hasDependencies: Mock;
        delete: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        userId: 'user-456',
    };

    const mockAcademicYear = {
        id: 'year-1',
        tenantId: 'tenant-123',
        name: '2024-2025',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2025-03-31'),
        isCurrent: false,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockActiveYear = {
        ...mockAcademicYear,
        id: 'year-2',
        name: '2023-2024',
        isCurrent: true,
        status: 'active',
    };

    beforeEach(() => {
        mockRepository = {
            findById: vi.fn(),
            findByName: vi.fn(),
            findCurrent: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            activateAtomic: vi.fn(),
            hasDependencies: vi.fn(),
            delete: vi.fn(),
        };

        service = new AcademicYearsService(mockRepository as unknown as AcademicYearsRepository);
    });

    describe('activateAcademicYear', () => {
        it('should atomically activate a year and deactivate the previous one', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockAcademicYear);
            mockRepository.activateAtomic.mockResolvedValue({
                ...mockAcademicYear,
                isCurrent: true,
                status: 'active',
            });

            // Act
            const result = await service.activateAcademicYear(mockAcademicYear.id, mockContext);

            // Assert
            expect(mockRepository.findById).toHaveBeenCalledWith(
                mockAcademicYear.id,
                mockContext.tenantId
            );
            expect(mockRepository.activateAtomic).toHaveBeenCalledWith(
                mockAcademicYear.id,
                mockContext.tenantId
            );
            expect(result.isCurrent).toBe(true);
            expect(result.status).toBe('active');
        });

        it('should throw error when trying to activate already active year', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockActiveYear);

            // Act & Assert
            await expect(
                service.activateAcademicYear(mockActiveYear.id, mockContext)
            ).rejects.toThrow('Academic year is already active');
        });

        it('should throw error when academic year not found', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.activateAcademicYear('non-existent-id', mockContext)
            ).rejects.toThrow('Academic year not found');
        });
    });

    describe('deleteAcademicYear', () => {
        it('should not allow deletion of active academic year', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockActiveYear);

            // Act & Assert
            await expect(
                service.deleteAcademicYear(mockActiveYear.id, mockContext)
            ).rejects.toThrow('Cannot delete the current active academic year');
        });

        it('should delete inactive academic year without dependencies', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockAcademicYear);
            mockRepository.hasDependencies.mockResolvedValue(false);
            mockRepository.delete.mockResolvedValue(mockAcademicYear);

            // Act
            await service.deleteAcademicYear(mockAcademicYear.id, mockContext);

            // Assert
            expect(mockRepository.delete).toHaveBeenCalledWith(mockAcademicYear.id);
        });
    });

    describe('createAcademicYear', () => {
        it('should create academic year with valid date range', async () => {
            // Arrange
            const input = {
                name: '2024-2025',
                startDate: '2024-04-01',
                endDate: '2025-03-31',
                status: 'draft' as const,
            };
            mockRepository.findByName.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(mockAcademicYear);

            // Act
            const result = await service.createAcademicYear(input, mockContext);

            // Assert
            expect(mockRepository.create).toHaveBeenCalled();
            expect(result.name).toBe('2024-2025');
        });

        it('should reject creation when end date is before start date', async () => {
            // Arrange
            const input = {
                name: '2024-2025',
                startDate: '2025-03-31',
                endDate: '2024-04-01', // End before start
                status: 'draft' as const,
            };
            mockRepository.findByName.mockResolvedValue(null);

            // Act & Assert
            await expect(service.createAcademicYear(input, mockContext)).rejects.toThrow(
                'End date must be after start date'
            );
        });

        it('should reject duplicate academic year name', async () => {
            // Arrange
            const input = {
                name: '2024-2025',
                startDate: '2024-04-01',
                endDate: '2025-03-31',
                status: 'draft' as const,
            };
            mockRepository.findByName.mockResolvedValue(mockAcademicYear);

            // Act & Assert
            await expect(service.createAcademicYear(input, mockContext)).rejects.toThrow(
                'Academic year with this name already exists'
            );
        });
    });
});
