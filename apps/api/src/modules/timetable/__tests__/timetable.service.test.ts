/**
 * Timetable Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { TimetableService } from '../timetable.service';
import type { TimetableRepository } from '../timetable.repository';

describe('TimetableService', () => {
    let service: TimetableService;
    let mockRepository: {
        findById: Mock;
        findMany: Mock;
        findByClassSection: Mock;
        findByTeacher: Mock;
        create: Mock;
        createEntry: Mock;
        deleteEntry: Mock;
        findEntryById: Mock;
        update: Mock;
        softDelete: Mock;
        checkTeacherConflict: Mock;
        checkSectionConflict: Mock;
        findClassById: Mock;
        findSectionById: Mock;
        findAcademicYearById: Mock;
        findPeriodById: Mock;
        findSubjectById: Mock;
        findTeacherById: Mock;
        findClassSubjectMapping: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockTimetable = {
        id: 'timetable-1',
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        academicYearId: 'year-1',
        classId: 'class-1',
        sectionId: 'section-1',
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        class: { id: 'class-1', name: 'Class 1', code: 'C1' },
        section: { id: 'section-1', name: 'Section A', code: 'A' },
        entries: [],
    };

    const mockEntry = {
        id: 'entry-1',
        dayOfWeek: 'monday',
        periodId: 'period-1',
        subjectId: 'subject-1',
        teacherId: 'teacher-1',
        period: { id: 'period-1', name: 'Period 1', startTime: '09:00', endTime: '09:45' },
        subject: { id: 'subject-1', name: 'Mathematics', code: 'MATH' },
        teacher: { id: 'teacher-1', firstName: 'John', lastName: 'Doe' },
    };

    beforeEach(() => {
        mockRepository = {
            findById: vi.fn(),
            findMany: vi.fn(),
            findByClassSection: vi.fn(),
            findByTeacher: vi.fn(),
            create: vi.fn(),
            createEntry: vi.fn(),
            deleteEntry: vi.fn(),
            findEntryById: vi.fn(),
            update: vi.fn(),
            softDelete: vi.fn(),
            checkTeacherConflict: vi.fn(),
            checkSectionConflict: vi.fn(),
            findClassById: vi.fn(),
            findSectionById: vi.fn(),
            findAcademicYearById: vi.fn(),
            findPeriodById: vi.fn(),
            findSubjectById: vi.fn(),
            findTeacherById: vi.fn(),
            findClassSubjectMapping: vi.fn(),
        };

        service = new TimetableService(mockRepository as unknown as TimetableRepository);
    });

    describe('createTimetable', () => {
        it('should create timetable successfully', async () => {
            // Arrange
            const input = {
                academicYearId: 'year-1',
                classId: 'class-1',
                sectionId: 'section-1',
                effectiveFrom: '2024-01-01',
            };
            mockRepository.findAcademicYearById.mockResolvedValue({ id: 'year-1' });
            mockRepository.findClassById.mockResolvedValue({ id: 'class-1', academicYearId: 'year-1' });
            mockRepository.findSectionById.mockResolvedValue({ id: 'section-1', classId: 'class-1' });
            mockRepository.create.mockResolvedValue(mockTimetable);

            // Act
            const result = await service.createTimetable(input, mockContext);

            // Assert
            expect(mockRepository.create).toHaveBeenCalled();
            expect(result.classId).toBe('class-1');
        });
    });

    describe('addEntry', () => {
        const entryInput = {
            dayOfWeek: 'monday' as const,
            periodId: 'period-1',
            subjectId: 'subject-1',
            teacherId: 'teacher-1',
        };

        it('should add entry successfully', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockTimetable);
            mockRepository.findPeriodById.mockResolvedValue({ id: 'period-1' });
            mockRepository.findSubjectById.mockResolvedValue({ id: 'subject-1' });
            mockRepository.findClassSubjectMapping.mockResolvedValue({ classId: 'class-1', subjectId: 'subject-1' });
            mockRepository.findTeacherById.mockResolvedValue({ id: 'teacher-1', branchId: 'branch-456', status: 'active' });
            mockRepository.checkTeacherConflict.mockResolvedValue(null);
            mockRepository.checkSectionConflict.mockResolvedValue(null);
            mockRepository.createEntry.mockResolvedValue(mockEntry);

            // Act
            const result = await service.addEntry('timetable-1', entryInput, mockContext);

            // Assert
            expect(mockRepository.createEntry).toHaveBeenCalled();
            expect(result.teacherId).toBe('teacher-1');
        });

        it('should reject teacher conflict', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockTimetable);
            mockRepository.findPeriodById.mockResolvedValue({ id: 'period-1' });
            mockRepository.findSubjectById.mockResolvedValue({ id: 'subject-1' });
            mockRepository.findClassSubjectMapping.mockResolvedValue({ classId: 'class-1', subjectId: 'subject-1' });
            mockRepository.findTeacherById.mockResolvedValue({ id: 'teacher-1', branchId: 'branch-456', status: 'active' });
            mockRepository.checkTeacherConflict.mockResolvedValue({
                id: 'conflict-entry',
                timetable: {
                    class: { name: 'Class 2' },
                    section: { name: 'Section B' },
                },
            });

            // Act & Assert
            await expect(service.addEntry('timetable-1', entryInput, mockContext)).rejects.toThrow(
                'Teacher is already assigned to Class 2 - Section B at this time'
            );
        });

        it('should reject section conflict', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockTimetable);
            mockRepository.findPeriodById.mockResolvedValue({ id: 'period-1' });
            mockRepository.findSubjectById.mockResolvedValue({ id: 'subject-1' });
            mockRepository.findClassSubjectMapping.mockResolvedValue({ classId: 'class-1', subjectId: 'subject-1' });
            mockRepository.findTeacherById.mockResolvedValue({ id: 'teacher-1', branchId: 'branch-456', status: 'active' });
            mockRepository.checkTeacherConflict.mockResolvedValue(null);
            mockRepository.checkSectionConflict.mockResolvedValue({
                id: 'conflict-entry',
                subject: { name: 'Physics' },
            });

            // Act & Assert
            await expect(service.addEntry('timetable-1', entryInput, mockContext)).rejects.toThrow(
                'Section already has Physics at this time'
            );
        });

        it('should reject subject not mapped to class', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockTimetable);
            mockRepository.findPeriodById.mockResolvedValue({ id: 'period-1' });
            mockRepository.findSubjectById.mockResolvedValue({ id: 'subject-1' });
            mockRepository.findClassSubjectMapping.mockResolvedValue(null);

            // Act & Assert
            await expect(service.addEntry('timetable-1', entryInput, mockContext)).rejects.toThrow(
                'Subject is not assigned to this class'
            );
        });

        it('should reject cross-tenant teacher', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockTimetable);
            mockRepository.findPeriodById.mockResolvedValue({ id: 'period-1' });
            mockRepository.findSubjectById.mockResolvedValue({ id: 'subject-1' });
            mockRepository.findClassSubjectMapping.mockResolvedValue({ classId: 'class-1', subjectId: 'subject-1' });
            mockRepository.findTeacherById.mockResolvedValue(null); // Cross-tenant returns null

            // Act & Assert
            await expect(service.addEntry('timetable-1', entryInput, mockContext)).rejects.toThrow(
                'Teacher not found'
            );
        });

        it('should reject teacher from wrong branch', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockTimetable);
            mockRepository.findPeriodById.mockResolvedValue({ id: 'period-1' });
            mockRepository.findSubjectById.mockResolvedValue({ id: 'subject-1' });
            mockRepository.findClassSubjectMapping.mockResolvedValue({ classId: 'class-1', subjectId: 'subject-1' });
            mockRepository.findTeacherById.mockResolvedValue({ id: 'teacher-1', branchId: 'other-branch', status: 'active' });

            // Act & Assert
            await expect(service.addEntry('timetable-1', entryInput, mockContext)).rejects.toThrow(
                'Teacher does not belong to this branch'
            );
        });
    });

    describe('deleteTimetable', () => {
        it('should soft delete timetable', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(mockTimetable);
            mockRepository.softDelete.mockResolvedValue([{}, mockTimetable]);

            // Act
            await service.deleteTimetable('timetable-1', mockContext);

            // Assert
            expect(mockRepository.softDelete).toHaveBeenCalledWith('timetable-1');
        });

        it('should hide soft-deleted timetable', async () => {
            // Arrange - findById returns null for deleted
            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.deleteTimetable('deleted-timetable', mockContext)).rejects.toThrow(
                'Timetable not found'
            );
        });
    });
});
