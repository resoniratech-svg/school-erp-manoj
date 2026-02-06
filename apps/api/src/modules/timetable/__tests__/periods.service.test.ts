/**
 * Periods Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { PeriodsService } from '../periods/periods.service';
import type { PeriodsRepository } from '../periods/periods.repository';

describe('PeriodsService', () => {
    let service: PeriodsService;
    let mockRepository: {
        findById: Mock;
        findByBranch: Mock;
        findOverlapping: Mock;
        create: Mock;
        update: Mock;
        softDelete: Mock;
        hasDependencies: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockPeriod = {
        id: 'period-1',
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        name: 'Period 1',
        startTime: '09:00',
        endTime: '09:45',
        displayOrder: 1,
        periodType: 'regular',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    beforeEach(() => {
        mockRepository = {
            findById: vi.fn(),
            findByBranch: vi.fn(),
            findOverlapping: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            softDelete: vi.fn(),
            hasDependencies: vi.fn(),
        };

        service = new PeriodsService(mockRepository as unknown as PeriodsRepository);
    });

    describe('createPeriod', () => {
        it('should create period successfully', async () => {
            // Arrange
            const input = {
                name: 'Period 1',
                startTime: '09:00',
                endTime: '09:45',
                displayOrder: 1,
            };
            mockRepository.findOverlapping.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue(mockPeriod);

            // Act
            const result = await service.createPeriod(input, mockContext);

            // Assert
            expect(mockRepository.create).toHaveBeenCalled();
            expect(result.name).toBe('Period 1');
            expect(result.startTime).toBe('09:00');
        });

        it('should reject overlapping period', async () => {
            // Arrange
            const input = {
                name: 'Period 2',
                startTime: '09:30',
                endTime: '10:15',
                displayOrder: 2,
            };
            mockRepository.findOverlapping.mockResolvedValue([mockPeriod]);

            // Act & Assert
            await expect(service.createPeriod(input, mockContext)).rejects.toThrow(
                'Period overlaps with existing period: Period 1'
            );
        });

        it('should reject invalid time range', async () => {
            // Arrange
            const input = {
                name: 'Invalid Period',
                startTime: '10:00',
                endTime: '09:00', // End before start
                displayOrder: 1,
            };

            // Act & Assert
            await expect(service.createPeriod(input, mockContext)).rejects.toThrow(
                'End time must be after start time'
            );
        });
    });

    describe('deletePeriod', () => {
        it('should delete period without dependencies', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockPeriod);
            mockRepository.hasDependencies.mockResolvedValue(false);
            mockRepository.softDelete.mockResolvedValue(mockPeriod);

            // Act
            await service.deletePeriod(mockPeriod.id, mockContext);

            // Assert
            expect(mockRepository.softDelete).toHaveBeenCalledWith(mockPeriod.id);
        });

        it('should reject deletion if period is referenced', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockPeriod);
            mockRepository.hasDependencies.mockResolvedValue(true);

            // Act & Assert
            await expect(service.deletePeriod(mockPeriod.id, mockContext)).rejects.toThrow(
                'Cannot delete period used in timetable entries'
            );
        });
    });
});
