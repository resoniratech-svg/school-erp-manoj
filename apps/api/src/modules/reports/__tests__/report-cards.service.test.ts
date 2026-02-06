/**
 * Report Cards Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ReportsService } from '../reports.service';
import type { ReportsRepository } from '../reports.repository';
import { EXAM_STATUS } from '../../exams/exams.constants';
import { RESULT_STATUS, ATTENDANCE_THRESHOLD_PERCENTAGE } from '../reports.constants';

describe('ReportsService', () => {
    let service: ReportsService;
    let mockRepository: {
        findById: Mock;
        findByStudentExam: Mock;
        findMany: Mock;
        create: Mock;
        update: Mock;
        findStudentById: Mock;
        findExamById: Mock;
        findStudentEnrollment: Mock;
        findStudentMarksForExam: Mock;
        findClassSubjectMappings: Mock;
        findStudentAttendance: Mock;
        findAcademicYearById: Mock;
        findAllStudentReportCards: Mock;
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
        rollNumber: '001',
        status: 'active',
    };

    const mockExam = {
        id: 'exam-1',
        name: 'Final Exam',
        type: 'final',
        status: EXAM_STATUS.PUBLISHED,
        academicYearId: 'year-1',
    };

    const mockEnrollment = {
        id: 'enrollment-1',
        sectionId: 'section-1',
        section: {
            id: 'section-1',
            name: 'A',
            classId: 'class-1',
            class: { id: 'class-1', name: 'Class 10' },
        },
    };

    const mockMarks = [
        {
            id: 'marks-1',
            marksObtained: 85,
            isAbsent: false,
            grade: 'A',
            percentage: 85,
            examSchedule: {
                id: 'schedule-1',
                maxMarks: 100,
                passingMarks: 40,
                subjectId: 'subject-1',
                subject: { id: 'subject-1', name: 'Mathematics', code: 'MATH' },
            },
        },
        {
            id: 'marks-2',
            marksObtained: 30,
            isAbsent: false,
            grade: 'F',
            percentage: 30,
            examSchedule: {
                id: 'schedule-2',
                maxMarks: 100,
                passingMarks: 40,
                subjectId: 'subject-2',
                subject: { id: 'subject-2', name: 'English', code: 'ENG' },
            },
        },
    ];

    const mockClassSubjects = [
        { subjectId: 'subject-1', isMandatory: true },
        { subjectId: 'subject-2', isMandatory: true },
    ];

    beforeEach(() => {
        mockRepository = {
            findById: vi.fn(),
            findByStudentExam: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            findStudentById: vi.fn(),
            findExamById: vi.fn(),
            findStudentEnrollment: vi.fn(),
            findStudentMarksForExam: vi.fn(),
            findClassSubjectMappings: vi.fn(),
            findStudentAttendance: vi.fn(),
            findAcademicYearById: vi.fn(),
            findAllStudentReportCards: vi.fn(),
            findStudentsByClass: vi.fn(),
        };

        service = new ReportsService(mockRepository as unknown as ReportsRepository);
    });

    describe('generateReportCard', () => {
        const generateInput = {
            studentId: 'student-1',
            examId: 'exam-1',
            academicYearId: 'year-1',
        };

        it('should generate report card successfully', async () => {
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findExamById.mockResolvedValue(mockExam);
            mockRepository.findStudentEnrollment.mockResolvedValue(mockEnrollment);
            mockRepository.findByStudentExam.mockResolvedValue(null);
            mockRepository.findStudentMarksForExam.mockResolvedValue([mockMarks[0]]); // Only passing marks
            mockRepository.findClassSubjectMappings.mockResolvedValue([mockClassSubjects[0]]);
            mockRepository.findStudentAttendance.mockResolvedValue(
                Array(100).fill({ status: 'present' }) // 100% attendance
            );
            mockRepository.create.mockResolvedValue({
                id: 'report-1',
                studentId: 'student-1',
                examId: 'exam-1',
                academicYearId: 'year-1',
                classId: 'class-1',
                sectionId: 'section-1',
                totalMarks: 85,
                totalMaxMarks: 100,
                overallPercentage: 85,
                overallGrade: 'A',
                result: RESULT_STATUS.PASS,
                rank: null,
                remarks: null,
                status: 'generated',
                generatedAt: new Date(),
                publishedAt: null,
                student: mockStudent,
                exam: mockExam,
                class: { id: 'class-1', name: 'Class 10' },
                section: { id: 'section-1', name: 'A' },
                academicYear: { id: 'year-1', name: '2024-25' },
            });

            const result = await service.generateReportCard(generateInput, mockContext);

            expect(mockRepository.create).toHaveBeenCalled();
            expect(result.result).toBe(RESULT_STATUS.PASS);
        });

        it('should reject unpublished exam', async () => {
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findExamById.mockResolvedValue({
                ...mockExam,
                status: EXAM_STATUS.DRAFT,
            });

            await expect(service.generateReportCard(generateInput, mockContext)).rejects.toThrow(
                'Cannot generate report card for unpublished exam'
            );
        });

        it('should calculate attendance eligibility correctly', async () => {
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findExamById.mockResolvedValue(mockExam);
            mockRepository.findStudentEnrollment.mockResolvedValue(mockEnrollment);
            mockRepository.findByStudentExam.mockResolvedValue(null);
            mockRepository.findStudentMarksForExam.mockResolvedValue([mockMarks[0]]);
            mockRepository.findClassSubjectMappings.mockResolvedValue([mockClassSubjects[0]]);
            // 70% attendance (below 75% threshold)
            const attendanceRecords = [
                ...Array(70).fill({ status: 'present' }),
                ...Array(30).fill({ status: 'absent' }),
            ];
            mockRepository.findStudentAttendance.mockResolvedValue(attendanceRecords);
            mockRepository.create.mockImplementation((data) => Promise.resolve({
                ...data,
                id: 'report-1',
                status: 'generated',
                generatedAt: new Date(),
                publishedAt: null,
                student: mockStudent,
                exam: mockExam,
                class: { id: 'class-1', name: 'Class 10' },
                section: { id: 'section-1', name: 'A' },
                academicYear: { id: 'year-1', name: '2024-25' },
            }));

            const result = await service.generateReportCard(generateInput, mockContext);

            // Should be withheld due to low attendance
            expect(result.result).toBe(RESULT_STATUS.WITHHELD);
            expect(result.attendance.isEligible).toBe(false);
        });

        it('should fail if mandatory subject failed', async () => {
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.findExamById.mockResolvedValue(mockExam);
            mockRepository.findStudentEnrollment.mockResolvedValue(mockEnrollment);
            mockRepository.findByStudentExam.mockResolvedValue(null);
            mockRepository.findStudentMarksForExam.mockResolvedValue(mockMarks); // Includes failing marks
            mockRepository.findClassSubjectMappings.mockResolvedValue(mockClassSubjects); // Both mandatory
            mockRepository.findStudentAttendance.mockResolvedValue(
                Array(100).fill({ status: 'present' })
            );
            mockRepository.create.mockImplementation((data) => Promise.resolve({
                ...data,
                id: 'report-1',
                status: 'generated',
                generatedAt: new Date(),
                publishedAt: null,
                student: mockStudent,
                exam: mockExam,
                class: { id: 'class-1', name: 'Class 10' },
                section: { id: 'section-1', name: 'A' },
                academicYear: { id: 'year-1', name: '2024-25' },
            }));

            const result = await service.generateReportCard(generateInput, mockContext);

            // Should fail due to mandatory subject failure
            expect(result.result).toBe(RESULT_STATUS.FAIL);
        });
    });

    describe('publishReportCard', () => {
        it('should reject already published report card', async () => {
            mockRepository.findById.mockResolvedValue({
                id: 'report-1',
                status: 'published',
            });

            await expect(
                service.publishReportCard('report-1', undefined, mockContext)
            ).rejects.toThrow('Report card is already published');
        });
    });
});
