/**
 * Transport Routes Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { TransportService } from '../transport.service';
import type { TransportRepository } from '../transport.repository';
import { ROUTE_STATUS, TRANSPORT_ERROR_CODES } from '../transport.constants';

describe('TransportService - Routes', () => {
    let service: TransportService;
    let mockRepository: {
        findRouteById: Mock;
        findRoutes: Mock;
        createRoute: Mock;
        updateRoute: Mock;
        softDeleteRoute: Mock;
        countActiveAssignmentsForRoute: Mock;
        findAcademicYearById: Mock;
        findVehicleById: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockRoute = {
        id: 'route-1',
        name: 'North Route',
        description: 'Northside pickup route',
        startPoint: 'School',
        endPoint: 'Mall',
        status: ROUTE_STATUS.ACTIVE,
        academicYearId: 'ay-1',
        branchId: 'branch-456',
        tenantId: 'tenant-123',
        stops: [],
        vehicle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockAcademicYear = {
        id: 'ay-1',
        name: '2024-2025',
        tenantId: 'tenant-123',
    };

    beforeEach(() => {
        mockRepository = {
            findRouteById: vi.fn(),
            findRoutes: vi.fn(),
            createRoute: vi.fn(),
            updateRoute: vi.fn(),
            softDeleteRoute: vi.fn(),
            countActiveAssignmentsForRoute: vi.fn(),
            findAcademicYearById: vi.fn(),
            findVehicleById: vi.fn(),
        };

        service = new TransportService(mockRepository as unknown as TransportRepository);
    });

    describe('createRoute', () => {
        it('should create route successfully', async () => {
            mockRepository.findAcademicYearById.mockResolvedValue(mockAcademicYear);
            mockRepository.createRoute.mockResolvedValue(mockRoute);

            const result = await service.createRoute(
                {
                    name: 'North Route',
                    startPoint: 'School',
                    endPoint: 'Mall',
                    academicYearId: 'ay-1',
                },
                mockContext
            );

            expect(result.name).toBe('North Route');
            expect(result.status).toBe(ROUTE_STATUS.ACTIVE);
        });
    });

    describe('deleteRoute', () => {
        it('should reject deletion when active assignments exist', async () => {
            mockRepository.findRouteById.mockResolvedValue(mockRoute);
            mockRepository.countActiveAssignmentsForRoute.mockResolvedValue(5);

            await expect(
                service.deleteRoute('route-1', mockContext)
            ).rejects.toThrow('Cannot delete route with 5 active student assignments');
        });

        it('should allow deletion when no active assignments', async () => {
            mockRepository.findRouteById.mockResolvedValue(mockRoute);
            mockRepository.countActiveAssignmentsForRoute.mockResolvedValue(0);
            mockRepository.softDeleteRoute.mockResolvedValue(mockRoute);

            await expect(
                service.deleteRoute('route-1', mockContext)
            ).resolves.not.toThrow();
        });
    });

    describe('cross-branch rejection', () => {
        it('should reject route from different branch', async () => {
            mockRepository.findRouteById.mockResolvedValue(null);

            await expect(
                service.getRouteById('route-other', mockContext)
            ).rejects.toThrow(TRANSPORT_ERROR_CODES.ROUTE_NOT_FOUND);
        });
    });
});
