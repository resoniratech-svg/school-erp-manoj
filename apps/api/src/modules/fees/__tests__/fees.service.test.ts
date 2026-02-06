/**
 * Fees Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { FeesService } from '../fees.service';
import type { FeesRepository } from '../fees.repository';
import { FEES_ERROR_CODES } from '../fees.constants';

describe('FeesService', () => {
    let service: FeesService;
    let mockRepository: {
        findStructureById: Mock;
        findStructures: Mock;
        createStructure: Mock;
        updateStructure: Mock;
        findAssignmentById: Mock;
        findExistingAssignment: Mock;
        findAssignments: Mock;
        createAssignment: Mock;
        findStudentById: Mock;
        findAcademicYearById: Mock;
        findStudentsByClass: Mock;
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
        status: 'active',
    };

    const mockStructure = {
        id: 'structure-1',
        tenantId: 'tenant-123',
        name: 'Tuition Fee',
        feeType: 'tuition',
        amount: 50000,
        frequency: 'yearly',
        academicYearId: 'year-1',
        classId: null,
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    const mockAcademicYear = {
        id: 'year-1',
        name: '2024-25',
    };

    beforeEach(() => {
        mockRepository = {
            findStructureById: vi.fn(),
            findStructures: vi.fn(),
            createStructure: vi.fn(),
            updateStructure: vi.fn(),
            findAssignmentById: vi.fn(),
            findExistingAssignment: vi.fn(),
            findAssignments: vi.fn(),
            createAssignment: vi.fn(),
            findStudentById: vi.fn(),
            findAcademicYearById: vi.fn(),
            findStudentsByClass: vi.fn(),
        };

        service = new FeesService(mockRepository as unknown as FeesRepository);
    });

    describe('createFeeStructure', () => {
        it('should create fee structure successfully', async () => {
            mockRepository.findAcademicYearById.mockResolvedValue(mockAcademicYear);
            mockRepository.createStructure.mockResolvedValue(mockStructure);

            const result = await service.createFeeStructure(
                {
                    name: 'Tuition Fee',
                    feeType: 'tuition',
                    amount: 50000,
                    frequency: 'yearly',
                    academicYearId: 'year-1',
                },
                mockContext
            );

            expect(mockRepository.createStructure).toHaveBeenCalled();
            expect(result.name).toBe('Tuition Fee');
            expect(result.amount).toBe(50000);
        });
    });

    describe('assignFee', () => {
        it('should assign fee successfully', async () => {
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findStructureById.mockResolvedValue(mockStructure);
            mockRepository.findExistingAssignment.mockResolvedValue(null);
            mockRepository.createAssignment.mockResolvedValue({
                id: 'assignment-1',
                studentId: 'student-1',
                feeStructureId: 'structure-1',
                academicYearId: 'year-1',
                totalAmount: 50000,
                discountAmount: 0,
                netAmount: 50000,
                paidAmount: 0,
                balanceAmount: 50000,
                status: 'pending',
                dueDate: null,
                createdAt: new Date(),
                student: mockStudent,
                feeStructure: mockStructure,
            });

            const result = await service.assignFee(
                {
                    studentId: 'student-1',
                    feeStructureId: 'structure-1',
                    academicYearId: 'year-1',
                },
                mockContext
            );

            expect(result.netAmount).toBe(50000);
            expect(result.balanceAmount).toBe(50000);
            expect(result.status).toBe('pending');
        });

        it('should reject duplicate assignment', async () => {
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findStructureById.mockResolvedValue(mockStructure);
            mockRepository.findExistingAssignment.mockResolvedValue({ id: 'existing' });

            await expect(
                service.assignFee(
                    {
                        studentId: 'student-1',
                        feeStructureId: 'structure-1',
                        academicYearId: 'year-1',
                    },
                    mockContext
                )
            ).rejects.toThrow('Fee already assigned to this student');
        });

        it('should reject cross-tenant student', async () => {
            mockRepository.findStudentById.mockResolvedValue(null); // Not found in tenant

            await expect(
                service.assignFee(
                    {
                        studentId: 'student-other-tenant',
                        feeStructureId: 'structure-1',
                        academicYearId: 'year-1',
                    },
                    mockContext
                )
            ).rejects.toThrow('Student not found');
        });
    });
});
