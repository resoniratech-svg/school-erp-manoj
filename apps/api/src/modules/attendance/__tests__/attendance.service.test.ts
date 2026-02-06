/**
 * Attendance Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { AttendanceService } from '../attendance.service';
import type { AttendanceRepository } from '../attendance.repository';
import { ATTENDANCE_STATUS } from '../attendance.constants';

describe('AttendanceService', () => {
    let service: AttendanceService;
    let mockRepository: {
        findById: Mock;
        findBySectionDate: Mock;
        findByStudentDate: Mock;
        findMany: Mock;
        findByStudentForSummary: Mock;
        bulkCreate: Mock;
        bulkUpsert: Mock;
        update: Mock;
        findStudentById: Mock;
        findStudentEnrollment: Mock;
        findSectionById: Mock;
        findAcademicYearById: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockAcademicYear = {
        id: 'year-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
    };

    const mockSection = {
        id: 'section-1',
        class: { branchId: 'branch-456' },
    };

    const mockStudent = {
        id: 'student-1',
        status: 'active',
    };

    const mockEnrollment = {
        id: 'enrollment-1',
    };

    const mockAttendance = {
        id: 'att-1',
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        studentId: 'student-1',
        sectionId: 'section-1',
        academicYearId: 'year-1',
        date: new Date('2024-06-15'),
        status: 'present',
        remarks: null,
        markedByUserId: 'user-789',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        mockRepository = {
            findById: vi.fn(),
            findBySectionDate: vi.fn(),
            findByStudentDate: vi.fn(),
            findMany: vi.fn(),
            findByStudentForSummary: vi.fn(),
            bulkCreate: vi.fn(),
            bulkUpsert: vi.fn(),
            update: vi.fn(),
            findStudentById: vi.fn(),
            findStudentEnrollment: vi.fn(),
            findSectionById: vi.fn(),
            findAcademicYearById: vi.fn(),
        };

        service = new AttendanceService(mockRepository as unknown as AttendanceRepository);
    });

    describe('bulkMarkAttendance', () => {
        const bulkInput = {
            sectionId: 'section-1',
            academicYearId: 'year-1',
            date: '2024-06-15',
            entries: [
                { studentId: 'student-1', status: ATTENDANCE_STATUS.PRESENT },
                { studentId: 'student-2', status: ATTENDANCE_STATUS.ABSENT },
            ],
            allowCorrection: false,
        };

        it('should bulk mark attendance successfully', async () => {
            // Arrange
            mockRepository.findAcademicYearById.mockResolvedValue(mockAcademicYear);
            mockRepository.findSectionById.mockResolvedValue(mockSection);
            mockRepository.findByStudentDate.mockResolvedValue(null);
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findStudentEnrollment.mockResolvedValue(mockEnrollment);
            mockRepository.bulkCreate.mockResolvedValue([mockAttendance, mockAttendance]);

            // Act
            const result = await service.bulkMarkAttendance(bulkInput, mockContext);

            // Assert
            expect(mockRepository.bulkCreate).toHaveBeenCalled();
            expect(result).toHaveLength(2);
        });

        it('should reject duplicate without correction flag', async () => {
            // Arrange
            mockRepository.findAcademicYearById.mockResolvedValue(mockAcademicYear);
            mockRepository.findSectionById.mockResolvedValue(mockSection);
            mockRepository.findByStudentDate.mockResolvedValue(mockAttendance); // Already exists

            // Act & Assert
            await expect(service.bulkMarkAttendance(bulkInput, mockContext)).rejects.toThrow(
                'Attendance already exists'
            );
        });

        it('should allow correction with flag', async () => {
            // Arrange
            const inputWithCorrection = { ...bulkInput, allowCorrection: true };
            mockRepository.findAcademicYearById.mockResolvedValue(mockAcademicYear);
            mockRepository.findSectionById.mockResolvedValue(mockSection);
            mockRepository.findByStudentDate.mockResolvedValue(mockAttendance);
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findStudentEnrollment.mockResolvedValue(mockEnrollment);
            mockRepository.bulkUpsert.mockResolvedValue([mockAttendance]);

            // Act
            const result = await service.bulkMarkAttendance(inputWithCorrection, mockContext);

            // Assert
            expect(mockRepository.bulkUpsert).toHaveBeenCalled();
            expect(result).toHaveLength(1);
        });

        it('should reject marking outside academic year', async () => {
            // Arrange
            const outsideInput = { ...bulkInput, date: '2025-06-15' };
            mockRepository.findAcademicYearById.mockResolvedValue(mockAcademicYear);

            // Act & Assert
            await expect(service.bulkMarkAttendance(outsideInput, mockContext)).rejects.toThrow(
                'Date is outside academic year range'
            );
        });

        it('should reject cross-tenant student', async () => {
            // Arrange
            mockRepository.findAcademicYearById.mockResolvedValue(mockAcademicYear);
            mockRepository.findSectionById.mockResolvedValue(mockSection);
            mockRepository.findByStudentDate.mockResolvedValue(null);
            mockRepository.findStudentById.mockResolvedValue(null); // Not found = cross-tenant

            // Act & Assert
            await expect(service.bulkMarkAttendance(bulkInput, mockContext)).rejects.toThrow(
                'Student not found'
            );
        });
    });

    describe('getStudentSummary', () => {
        it('should calculate summary percentage correctly', async () => {
            // Arrange
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findByStudentForSummary.mockResolvedValue([
                { status: ATTENDANCE_STATUS.PRESENT, date: new Date() },
                { status: ATTENDANCE_STATUS.PRESENT, date: new Date() },
                { status: ATTENDANCE_STATUS.LATE, date: new Date() },
                { status: ATTENDANCE_STATUS.ABSENT, date: new Date() },
                { status: ATTENDANCE_STATUS.HALF_DAY, date: new Date() },
            ]);

            // Act
            const result = await service.getStudentSummary('student-1', undefined, mockContext);

            // Assert
            expect(result.totalDays).toBe(5);
            expect(result.presentDays).toBe(2);
            expect(result.lateDays).toBe(1);
            expect(result.absentDays).toBe(1);
            expect(result.halfDays).toBe(1);
            // (2 + 1 + 0.5) / 5 = 70%
            expect(result.percentage).toBe(70);
        });

        it('should return 0 percentage for no records', async () => {
            // Arrange
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findByStudentForSummary.mockResolvedValue([]);

            // Act
            const result = await service.getStudentSummary('student-1', undefined, mockContext);

            // Assert
            expect(result.totalDays).toBe(0);
            expect(result.percentage).toBe(0);
        });
    });
});
