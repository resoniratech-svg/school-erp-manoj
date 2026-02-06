/**
 * Transport Assignments Service Unit Tests
 * CRITICAL: Tests for capacity and single-assignment enforcement
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { TransportService } from '../transport.service';
import type { TransportRepository } from '../transport.repository';
import { ASSIGNMENT_STATUS, TRANSPORT_ERROR_CODES } from '../transport.constants';

describe('TransportService - Assignments', () => {
    let service: TransportService;
    let mockRepository: {
        findAssignmentById: Mock;
        findAssignments: Mock;
        createAssignment: Mock;
        updateAssignment: Mock;
        softDeleteAssignment: Mock;
        findActiveAssignmentForStudent: Mock;
        findRouteById: Mock;
        findStudentById: Mock;
        getVehicleOccupancy: Mock;
        findStopById: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockStudent = {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: 'tenant-123',
    };

    const mockRoute = {
        id: 'route-1',
        name: 'North Route',
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        stops: [],
        vehicle: {
            id: 'vehicle-1',
            capacity: 40,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockAssignment = {
        id: 'assign-1',
        studentId: 'student-1',
        routeId: 'route-1',
        pickupStopId: null,
        dropStopId: null,
        effectiveFrom: new Date(),
        effectiveTo: null,
        status: ASSIGNMENT_STATUS.ACTIVE,
        student: mockStudent,
        route: { name: 'North Route' },
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        mockRepository = {
            findAssignmentById: vi.fn(),
            findAssignments: vi.fn(),
            createAssignment: vi.fn(),
            updateAssignment: vi.fn(),
            softDeleteAssignment: vi.fn(),
            findActiveAssignmentForStudent: vi.fn(),
            findRouteById: vi.fn(),
            findStudentById: vi.fn(),
            getVehicleOccupancy: vi.fn(),
            findStopById: vi.fn(),
        };

        service = new TransportService(mockRepository as unknown as TransportRepository);
    });

    describe('createAssignment', () => {
        it('should create assignment successfully when capacity available', async () => {
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findRouteById.mockResolvedValue(mockRoute);
            mockRepository.findActiveAssignmentForStudent.mockResolvedValue(false);
            mockRepository.getVehicleOccupancy.mockResolvedValue(30); // Under capacity
            mockRepository.createAssignment.mockResolvedValue(mockAssignment);

            const result = await service.createAssignment(
                {
                    studentId: 'student-1',
                    routeId: 'route-1',
                    effectiveFrom: '2024-01-01',
                },
                mockContext
            );

            expect(result.studentId).toBe('student-1');
            expect(result.status).toBe(ASSIGNMENT_STATUS.ACTIVE);
        });

        it('should reject when vehicle capacity exceeded', async () => {
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findRouteById.mockResolvedValue(mockRoute);
            mockRepository.findActiveAssignmentForStudent.mockResolvedValue(false);
            mockRepository.getVehicleOccupancy.mockResolvedValue(40); // At capacity

            await expect(
                service.createAssignment(
                    {
                        studentId: 'student-1',
                        routeId: 'route-1',
                        effectiveFrom: '2024-01-01',
                    },
                    mockContext
                )
            ).rejects.toThrow('Vehicle capacity (40) has been reached');
        });

        it('should reject duplicate student assignment', async () => {
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findRouteById.mockResolvedValue(mockRoute);
            mockRepository.findActiveAssignmentForStudent.mockResolvedValue(true); // Already assigned

            await expect(
                service.createAssignment(
                    {
                        studentId: 'student-1',
                        routeId: 'route-1',
                        effectiveFrom: '2024-01-01',
                    },
                    mockContext
                )
            ).rejects.toThrow('Student already has an active transport assignment');
        });
    });

    describe('cross-branch rejection', () => {
        it('should reject assignment when route not in branch', async () => {
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findRouteById.mockResolvedValue(null); // Not found in this branch

            await expect(
                service.createAssignment(
                    {
                        studentId: 'student-1',
                        routeId: 'route-other',
                        effectiveFrom: '2024-01-01',
                    },
                    mockContext
                )
            ).rejects.toThrow(TRANSPORT_ERROR_CODES.ROUTE_NOT_FOUND);
        });
    });

    describe('soft delete protection', () => {
        it('should soft delete and set status to cancelled', async () => {
            mockRepository.findAssignmentById.mockResolvedValue(mockAssignment);
            mockRepository.softDeleteAssignment.mockResolvedValue({
                ...mockAssignment,
                status: ASSIGNMENT_STATUS.CANCELLED,
                deletedAt: new Date(),
            });

            await expect(
                service.cancelAssignment('assign-1', mockContext)
            ).resolves.not.toThrow();

            expect(mockRepository.softDeleteAssignment).toHaveBeenCalledWith('assign-1');
        });
    });
});
