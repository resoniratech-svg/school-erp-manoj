/**
 * Marks Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { MarksService } from '../marks/marks.service';
import type { MarksRepository } from '../marks/marks.repository';
import { EXAM_STATUS } from '../exams.constants';

describe('MarksService', () => {
    let service: MarksService;
    let mockRepository: {
        findById: Mock;
        findBySchedule: Mock;
        findByStudentExam: Mock;
        findByStudentSchedule: Mock;
        bulkCreate: Mock;
        update: Mock;
        findScheduleById: Mock;
        findStudentById: Mock;
        findStudentEnrollment: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockSchedule = {
        id: 'schedule-1',
        examId: 'exam-1',
        classId: 'class-1',
        subjectId: 'subject-1',
        date: new Date('2024-06-01'), // Past date
        maxMarks: 100,
        passingMarks: 40,
        exam: {
            id: 'exam-1',
            status: EXAM_STATUS.SCHEDULED,
            tenantId: 'tenant-123',
            branchId: 'branch-456',
        },
    };

    const mockStudent = {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
    };

    const mockEnrollment = { id: 'enrollment-1' };

    const mockMarks = {
        id: 'marks-1',
        examScheduleId: 'schedule-1',
        studentId: 'student-1',
        marksObtained: 85,
        isAbsent: false,
        remarks: null,
        grade: 'A',
        percentage: 85,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        mockRepository = {
            findById: vi.fn(),
            findBySchedule: vi.fn(),
            findByStudentExam: vi.fn(),
            findByStudentSchedule: vi.fn(),
            bulkCreate: vi.fn(),
            update: vi.fn(),
            findScheduleById: vi.fn(),
            findStudentById: vi.fn(),
            findStudentEnrollment: vi.fn(),
        };

        service = new MarksService(mockRepository as unknown as MarksRepository);
    });

    describe('bulkEnterMarks', () => {
        const bulkInput = {
            examScheduleId: 'schedule-1',
            entries: [
                { studentId: 'student-1', marksObtained: 85 },
                { studentId: 'student-2', marksObtained: 72 },
            ],
        };

        it('should bulk enter marks successfully', async () => {
            mockRepository.findScheduleById.mockResolvedValue(mockSchedule);
            mockRepository.findByStudentSchedule.mockResolvedValue(null);
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findStudentEnrollment.mockResolvedValue(mockEnrollment);
            mockRepository.bulkCreate.mockResolvedValue([mockMarks, mockMarks]);

            const result = await service.bulkEnterMarks(bulkInput, mockContext);

            expect(mockRepository.bulkCreate).toHaveBeenCalled();
            expect(result).toHaveLength(2);
        });

        it('should reject marks exceeding max', async () => {
            mockRepository.findScheduleById.mockResolvedValue(mockSchedule);
            mockRepository.findByStudentSchedule.mockResolvedValue(null);
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findStudentEnrollment.mockResolvedValue(mockEnrollment);

            const overMaxInput = {
                examScheduleId: 'schedule-1',
                entries: [{ studentId: 'student-1', marksObtained: 150 }], // > 100
            };

            await expect(service.bulkEnterMarks(overMaxInput, mockContext)).rejects.toThrow(
                'Marks 150 exceed max marks 100'
            );
        });

        it('should reject duplicate marks entry', async () => {
            mockRepository.findScheduleById.mockResolvedValue(mockSchedule);
            mockRepository.findByStudentSchedule.mockResolvedValue(mockMarks); // Already exists

            await expect(service.bulkEnterMarks(bulkInput, mockContext)).rejects.toThrow(
                'Marks already entered'
            );
        });

        it('should reject entry after publish', async () => {
            mockRepository.findScheduleById.mockResolvedValue({
                ...mockSchedule,
                exam: { ...mockSchedule.exam, status: EXAM_STATUS.PUBLISHED },
            });

            await expect(service.bulkEnterMarks(bulkInput, mockContext)).rejects.toThrow(
                'Cannot enter marks for published exam'
            );
        });

        it('should reject entry before exam date', async () => {
            const futureSchedule = {
                ...mockSchedule,
                date: new Date('2030-12-31'), // Future date
            };
            mockRepository.findScheduleById.mockResolvedValue(futureSchedule);

            await expect(service.bulkEnterMarks(bulkInput, mockContext)).rejects.toThrow(
                'Cannot enter marks before exam date'
            );
        });
    });

    describe('updateMarks', () => {
        it('should reject update after publish', async () => {
            mockRepository.findById.mockResolvedValue(mockMarks);
            mockRepository.findScheduleById.mockResolvedValue({
                ...mockSchedule,
                exam: { ...mockSchedule.exam, status: EXAM_STATUS.PUBLISHED },
            });

            await expect(
                service.updateMarks('marks-1', { marksObtained: 90 }, mockContext)
            ).rejects.toThrow('Cannot modify marks for published exam');
        });
    });

    describe('grade calculation', () => {
        it('should calculate grade correctly', async () => {
            mockRepository.findScheduleById.mockResolvedValue(mockSchedule);
            mockRepository.findByStudentSchedule.mockResolvedValue(null);
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findStudentEnrollment.mockResolvedValue(mockEnrollment);
            mockRepository.bulkCreate.mockImplementation((entries) =>
                Promise.resolve(entries.map((e: Record<string, unknown>) => ({
                    ...mockMarks,
                    marksObtained: e.marksObtained,
                    grade: e.grade,
                    percentage: e.percentage,
                })))
            );

            const input = {
                examScheduleId: 'schedule-1',
                entries: [{ studentId: 'student-1', marksObtained: 95 }], // A+ grade
            };

            await service.bulkEnterMarks(input, mockContext);

            expect(mockRepository.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        grade: 'A+',
                        percentage: 95,
                    }),
                ])
            );
        });
    });
});
