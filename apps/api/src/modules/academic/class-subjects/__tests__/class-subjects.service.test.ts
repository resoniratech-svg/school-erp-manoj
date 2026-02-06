/**
 * Class-Subjects Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ClassSubjectsService } from '../class-subjects.service';
import type { ClassSubjectsRepository } from '../class-subjects.repository';

describe('ClassSubjectsService', () => {
    let service: ClassSubjectsService;
    let mockRepository: {
        findClassById: Mock;
        findSubjectById: Mock;
        findClassSubject: Mock;
        findByClassId: Mock;
        create: Mock;
        delete: Mock;
        hasDependencies: Mock;
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
    };

    const mockSubject = {
        id: 'subject-1',
        name: 'Mathematics',
        code: 'MATH',
        tenantId: 'tenant-123',
        deletedAt: null,
    };

    const mockClassSubject = {
        classId: 'class-1',
        subjectId: 'subject-1',
        isMandatory: true,
        periodsPerWeek: 5,
        createdAt: new Date(),
        subject: {
            id: 'subject-1',
            name: 'Mathematics',
            code: 'MATH',
            type: 'core',
        },
    };

    beforeEach(() => {
        mockRepository = {
            findClassById: vi.fn(),
            findSubjectById: vi.fn(),
            findClassSubject: vi.fn(),
            findByClassId: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            hasDependencies: vi.fn(),
        };

        service = new ClassSubjectsService(mockRepository as unknown as ClassSubjectsRepository);
    });

    describe('assignSubject', () => {
        it('should assign subject to class successfully', async () => {
            // Arrange
            mockRepository.findClassById.mockResolvedValue(mockClass);
            mockRepository.findSubjectById.mockResolvedValue(mockSubject);
            mockRepository.findClassSubject.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(mockClassSubject);

            // Act
            const result = await service.assignSubject(
                'class-1',
                { subjectId: 'subject-1', isMandatory: true, periodsPerWeek: 5 },
                mockContext
            );

            // Assert
            expect(mockRepository.create).toHaveBeenCalled();
            expect(result.subjectId).toBe('subject-1');
            expect(result.isMandatory).toBe(true);
        });

        it('should prevent duplicate assignment', async () => {
            // Arrange
            mockRepository.findClassById.mockResolvedValue(mockClass);
            mockRepository.findSubjectById.mockResolvedValue(mockSubject);
            mockRepository.findClassSubject.mockResolvedValue(mockClassSubject);

            // Act & Assert
            await expect(
                service.assignSubject(
                    'class-1',
                    { subjectId: 'subject-1' },
                    mockContext
                )
            ).rejects.toThrow('Subject is already assigned to this class');
        });

        it('should reject cross-tenant subject', async () => {
            // Arrange - subject not found due to tenant filter
            mockRepository.findClassById.mockResolvedValue(mockClass);
            mockRepository.findSubjectById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.assignSubject(
                    'class-1',
                    { subjectId: 'other-tenant-subject' },
                    mockContext
                )
            ).rejects.toThrow('Subject not found');
        });

        it('should reject soft-deleted subject', async () => {
            // Arrange
            mockRepository.findClassById.mockResolvedValue(mockClass);
            mockRepository.findSubjectById.mockResolvedValue({
                ...mockSubject,
                deletedAt: new Date(),
            });

            // Act & Assert
            await expect(
                service.assignSubject(
                    'class-1',
                    { subjectId: 'subject-1' },
                    mockContext
                )
            ).rejects.toThrow('Subject has been deleted');
        });
    });

    describe('listClassSubjects', () => {
        it('should list subjects for a class', async () => {
            // Arrange
            mockRepository.findClassById.mockResolvedValue(mockClass);
            mockRepository.findByClassId.mockResolvedValue([mockClassSubject]);

            // Act
            const result = await service.listClassSubjects('class-1', mockContext);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].subject.name).toBe('Mathematics');
        });

        it('should reject non-existent class', async () => {
            // Arrange
            mockRepository.findClassById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.listClassSubjects('non-existent-class', mockContext)
            ).rejects.toThrow('Class not found or access denied');
        });
    });

    describe('removeSubject', () => {
        it('should remove subject from class successfully', async () => {
            // Arrange
            mockRepository.findClassById.mockResolvedValue(mockClass);
            mockRepository.findClassSubject.mockResolvedValue(mockClassSubject);
            mockRepository.hasDependencies.mockResolvedValue(false);
            mockRepository.delete.mockResolvedValue(mockClassSubject);

            // Act
            await service.removeSubject('class-1', 'subject-1', mockContext);

            // Assert
            expect(mockRepository.delete).toHaveBeenCalledWith('class-1', 'subject-1');
        });

        it('should reject removal when not assigned', async () => {
            // Arrange
            mockRepository.findClassById.mockResolvedValue(mockClass);
            mockRepository.findClassSubject.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.removeSubject('class-1', 'subject-not-assigned', mockContext)
            ).rejects.toThrow('Subject is not assigned to this class');
        });

        it('should reject removal when has dependencies', async () => {
            // Arrange
            mockRepository.findClassById.mockResolvedValue(mockClass);
            mockRepository.findClassSubject.mockResolvedValue(mockClassSubject);
            mockRepository.hasDependencies.mockResolvedValue(true);

            // Act & Assert
            await expect(
                service.removeSubject('class-1', 'subject-1', mockContext)
            ).rejects.toThrow('Cannot remove subject with existing timetable entries or exams');
        });
    });
});
