/**
 * Transcripts Types
 */
import type { ReportStatus, ResultStatus } from '../reports.constants';

export interface AcademicYearRecord {
    academicYearId: string;
    academicYearName: string;
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    exams: Array<{
        examId: string;
        examName: string;
        examType: string;
        totalMarks: number;
        totalMaxMarks: number;
        overallPercentage: number;
        overallGrade: string;
        result: ResultStatus;
    }>;
    finalResult: ResultStatus;
    promoted: boolean;
}

export interface TranscriptData {
    studentId: string;
    studentName: string;
    rollNumber: string | null;
    academicHistory: AcademicYearRecord[];
    currentStatus: 'active' | 'graduated' | 'transferred' | 'withdrawn';
    generatedAt: string;
}
