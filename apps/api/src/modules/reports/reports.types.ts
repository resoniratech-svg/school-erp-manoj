/**
 * Reports Types
 */
import type { ReportStatus, ResultStatus } from './reports.constants';

export interface SubjectResult {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    isMandatory: boolean;
    maxMarks: number;
    marksObtained: number;
    percentage: number;
    grade: string;
    isPassing: boolean;
}

export interface AttendanceSummary {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    percentage: number;
    isEligible: boolean;
}

export interface ReportCardData {
    id: string;
    studentId: string;
    studentName: string;
    rollNumber: string | null;
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    academicYearId: string;
    academicYearName: string;
    examId: string;
    examName: string;
    examType: string;
    subjects: SubjectResult[];
    attendance: AttendanceSummary;
    totalMarks: number;
    totalMaxMarks: number;
    overallPercentage: number;
    overallGrade: string;
    result: ResultStatus;
    rank: number | null;
    remarks: string | null;
    status: ReportStatus;
    generatedAt: string | null;
    publishedAt: string | null;
}

export interface GenerateReportCardInput {
    studentId: string;
    examId: string;
    academicYearId: string;
}

export interface PublishReportCardInput {
    reportCardId: string;
    remarks?: string;
}

export interface ReportContext {
    tenantId: string;
    branchId: string;
    userId: string;
}
