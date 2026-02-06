/**
 * Staff Attendance Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { StaffAttendanceService } from '../staff/staff-attendance.service';
import type { StaffAttendanceRepository } from '../staff/staff-attendance.repository';
import { STAFF_ATTENDANCE_STATUS } from '../staff/staff-attendance.constants';

describe('StaffAttendanceService', () => {
    let service: StaffAttendanceService;
    let mockRepository: {
        findById: Mock;
        findByStaffDate: Mock;
        findMany: Mock;
        create: Mock;
        update: Mock;
        findStaffById: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockStaff = {
        id: 'staff-1',
        branchId: 'branch-456',
        status: 'active',
    };

    const mockAttendance = {
        id: 'staff-att-1',
        staffId: 'staff-1',
        date: new Date('2024-06-15'),
        status: STAFF_ATTENDANCE_STATUS.PRESENT,
        checkInTime: '09:00',
        checkOutTime: '17:00',
        remarks: null,
        markedByUserId: 'user-789',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        mockRepository = {
            findById: vi.fn(),
            findByStaffDate: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            findStaffById: vi.fn(),
        };

        service = new StaffAttendanceService(mockRepository as unknown as StaffAttendanceRepository);
    });

    describe('markAttendance', () => {
        // Use yesterday to ensure it's not in the future
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const markInput = {
            staffId: 'staff-1',
            date: yesterdayStr,
            status: STAFF_ATTENDANCE_STATUS.PRESENT,
            checkInTime: '09:00',
            checkOutTime: '17:00',
        };

        it('should mark staff attendance successfully', async () => {
            // Arrange
            mockRepository.findStaffById.mockResolvedValue(mockStaff);
            mockRepository.findByStaffDate.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(mockAttendance);

            // Act
            const result = await service.markAttendance(markInput, mockContext);

            // Assert
            expect(mockRepository.create).toHaveBeenCalled();
            expect(result.status).toBe(STAFF_ATTENDANCE_STATUS.PRESENT);
        });

        it('should reject duplicate day', async () => {
            // Arrange
            mockRepository.findStaffById.mockResolvedValue(mockStaff);
            mockRepository.findByStaffDate.mockResolvedValue(mockAttendance);

            // Act & Assert
            await expect(service.markAttendance(markInput, mockContext)).rejects.toThrow(
                'Attendance already marked for this date'
            );
        });

        it('should reject inactive staff', async () => {
            // Arrange
            mockRepository.findStaffById.mockResolvedValue({ ...mockStaff, status: 'inactive' });

            // Act & Assert
            await expect(service.markAttendance(markInput, mockContext)).rejects.toThrow(
                'Staff is not active'
            );
        });

        it('should reject future date', async () => {
            // Arrange
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const futureInput = { ...markInput, date: tomorrow.toISOString().split('T')[0] };
            mockRepository.findStaffById.mockResolvedValue(mockStaff);

            // Act & Assert
            await expect(service.markAttendance(futureInput, mockContext)).rejects.toThrow(
                'Cannot mark attendance for future dates'
            );
        });

        it('should reject staff from wrong branch', async () => {
            // Arrange
            mockRepository.findStaffById.mockResolvedValue({ ...mockStaff, branchId: 'other-branch' });

            // Act & Assert
            await expect(service.markAttendance(markInput, mockContext)).rejects.toThrow(
                'Staff does not belong to this branch'
            );
        });
    });
});
