/**
 * Transcripts Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { TranscriptsService } from '../transcripts/transcripts.service';
import { RESULT_STATUS } from '../reports.constants';

// Mock the repository
vi.mock('../reports.repository', () => ({
    reportsRepository: {
        findStudentById: vi.fn(),
        findAllStudentReportCards: vi.fn(),
    },
}));

import { reportsRepository } from '../reports.repository';

describe('TranscriptsService', () => {
    let service: TranscriptsService;

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

    const mockReportCards = [
        {
            id: 'report-1',
            studentId: 'student-1',
            examId: 'exam-1',
            academicYearId: 'year-1',
            classId: 'class-1',
            sectionId: 'section-1',
            totalMarks: 450,
            totalMaxMarks: 500,
            overallPercentage: 90,
            overallGrade: 'A+',
            result: RESULT_STATUS.PASS,
            rank: 1,
            remarks: null,
            status: 'published',
            generatedAt: new Date(),
            publishedAt: new Date(),
            exam: { id: 'exam-1', name: 'Mid Term', type: 'mid_term', status: 'published' },
            class: { id: 'class-1', name: 'Class 9' },
            section: { id: 'section-1', name: 'A' },
            academicYear: { id: 'year-1', name: '2023-24' },
        },
        {
            id: 'report-2',
            studentId: 'student-1',
            examId: 'exam-2',
            academicYearId: 'year-2',
            classId: 'class-2',
            sectionId: 'section-2',
            totalMarks: 420,
            totalMaxMarks: 500,
            overallPercentage: 84,
            overallGrade: 'A',
            result: RESULT_STATUS.PASS,
            rank: 3,
            remarks: null,
            status: 'published',
            generatedAt: new Date(),
            publishedAt: new Date(),
            exam: { id: 'exam-2', name: 'Final', type: 'final', status: 'published' },
            class: { id: 'class-2', name: 'Class 10' },
            section: { id: 'section-2', name: 'A' },
            academicYear: { id: 'year-2', name: '2024-25' },
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        service = new TranscriptsService();
    });

    describe('generateTranscript', () => {
        it('should aggregate all academic history', async () => {
            (reportsRepository.findStudentById as Mock).mockResolvedValue(mockStudent);
            (reportsRepository.findAllStudentReportCards as Mock).mockResolvedValue(mockReportCards);

            const result = await service.generateTranscript('student-1', mockContext);

            expect(result.studentId).toBe('student-1');
            expect(result.studentName).toBe('John Doe');
            expect(result.academicHistory).toHaveLength(2);
            expect(result.academicHistory[0].academicYearId).toBe('year-1');
            expect(result.academicHistory[1].academicYearId).toBe('year-2');
        });

        it('should reject cross-tenant student', async () => {
            (reportsRepository.findStudentById as Mock).mockResolvedValue(null);

            await expect(
                service.generateTranscript('student-other-tenant', mockContext)
            ).rejects.toThrow('Student not found');
        });

        it('should mark year as failed if any exam failed', async () => {
            const failedReportCards = [
                {
                    ...mockReportCards[0],
                    result: RESULT_STATUS.FAIL,
                },
            ];
            (reportsRepository.findStudentById as Mock).mockResolvedValue(mockStudent);
            (reportsRepository.findAllStudentReportCards as Mock).mockResolvedValue(failedReportCards);

            const result = await service.generateTranscript('student-1', mockContext);

            expect(result.academicHistory[0].finalResult).toBe(RESULT_STATUS.FAIL);
            expect(result.academicHistory[0].promoted).toBe(false);
        });
    });
});
