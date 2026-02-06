/**
 * Exams Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ExamsService } from '../exams.service';
import type { ExamsRepository } from '../exams.repository';
import { EXAM_STATUS, EXAM_TYPE } from '../exams.constants';

describe('ExamsService', () => {
    let service: ExamsService;
    let mockRepository: {
        findById: Mock;
        findMany: Mock;
        findOverlapping: Mock;
        create: Mock;
        update: Mock;
        softDelete: Mock;
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

    const mockExam = {
        id: 'exam-1',
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        academicYearId: 'year-1',
        name: 'Mid Term Exam',
        type: EXAM_TYPE.MID_TERM,
        status: EXAM_STATUS.DRAFT,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-15'),
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    beforeEach(() => {
        mockRepository = {
            findById: vi.fn(),
            findMany: vi.fn(),
            findOverlapping: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            softDelete: vi.fn(),
            findAcademicYearById: vi.fn(),
        };

        service = new ExamsService(mockRepository as unknown as ExamsRepository);
    });

    describe('createExam', () => {
        const createInput = {
            name: 'Mid Term Exam',
            type: EXAM_TYPE.MID_TERM,
            academicYearId: 'year-1',
            startDate: '2024-06-01',
            endDate: '2024-06-15',
        };

        it('should create exam successfully', async () => {
            mockRepository.findAcademicYearById.mockResolvedValue(mockAcademicYear);
            mockRepository.findOverlapping.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue(mockExam);

            const result = await service.createExam(createInput, mockContext);

            expect(mockRepository.create).toHaveBeenCalled();
            expect(result.name).toBe('Mid Term Exam');
            expect(result.status).toBe(EXAM_STATUS.DRAFT);
        });

        it('should reject overlapping exams', async () => {
            mockRepository.findAcademicYearById.mockResolvedValue(mockAcademicYear);
            mockRepository.findOverlapping.mockResolvedValue([mockExam]);

            await expect(service.createExam(createInput, mockContext)).rejects.toThrow(
                'Exam dates overlap with existing exam'
            );
        });
    });

    describe('publishExam', () => {
        it('should publish exam successfully', async () => {
            mockRepository.findById.mockResolvedValue(mockExam);
            mockRepository.update.mockResolvedValue({
                ...mockExam,
                status: EXAM_STATUS.PUBLISHED,
            });

            const result = await service.publishExam('exam-1', mockContext);

            expect(mockRepository.update).toHaveBeenCalledWith('exam-1', {
                status: EXAM_STATUS.PUBLISHED,
            });
            expect(result.status).toBe(EXAM_STATUS.PUBLISHED);
        });

        it('should reject already published exam', async () => {
            mockRepository.findById.mockResolvedValue({
                ...mockExam,
                status: EXAM_STATUS.PUBLISHED,
            });

            await expect(service.publishExam('exam-1', mockContext)).rejects.toThrow(
                'Exam is already published'
            );
        });
    });

    describe('updateExam', () => {
        it('should reject edits after publish', async () => {
            mockRepository.findById.mockResolvedValue({
                ...mockExam,
                status: EXAM_STATUS.PUBLISHED,
            });

            await expect(
                service.updateExam('exam-1', { name: 'New Name' }, mockContext)
            ).rejects.toThrow('Cannot edit published exam');
        });
    });

    describe('deleteExam', () => {
        it('should reject deletion of published exam', async () => {
            mockRepository.findById.mockResolvedValue({
                ...mockExam,
                status: EXAM_STATUS.PUBLISHED,
            });

            await expect(service.deleteExam('exam-1', mockContext)).rejects.toThrow(
                'Cannot delete published exam'
            );
        });
    });
});
