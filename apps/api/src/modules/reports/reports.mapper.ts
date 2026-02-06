/**
 * Reports Mapper
 */
import type { ReportCardData, SubjectResult, AttendanceSummary } from './reports.types';
import type { ReportStatus, ResultStatus } from './reports.constants';

type ReportCardFromDb = {
    id: string;
    studentId: string;
    examId: string;
    academicYearId: string;
    classId: string;
    sectionId: string;
    totalMarks: number;
    totalMaxMarks: number;
    overallPercentage: number;
    overallGrade: string;
    result: string;
    rank: number | null;
    remarks: string | null;
    status: string;
    generatedAt: Date | null;
    publishedAt: Date | null;
    student?: {
        id: string;
        firstName: string;
        lastName: string;
        rollNumber: string | null;
    };
    exam?: {
        id: string;
        name: string;
        type: string;
        status: string;
    };
    class?: {
        id: string;
        name: string;
    };
    section?: {
        id: string;
        name: string;
    };
    academicYear?: {
        id: string;
        name: string;
    };
};

export function toReportCardResponse(
    reportCard: ReportCardFromDb,
    subjects: SubjectResult[] = [],
    attendance: AttendanceSummary = { totalDays: 0, presentDays: 0, absentDays: 0, percentage: 0, isEligible: true }
): ReportCardData {
    return {
        id: reportCard.id,
        studentId: reportCard.studentId,
        studentName: reportCard.student
            ? `${reportCard.student.firstName} ${reportCard.student.lastName}`
            : '',
        rollNumber: reportCard.student?.rollNumber || null,
        classId: reportCard.classId,
        className: reportCard.class?.name || '',
        sectionId: reportCard.sectionId,
        sectionName: reportCard.section?.name || '',
        academicYearId: reportCard.academicYearId,
        academicYearName: reportCard.academicYear?.name || '',
        examId: reportCard.examId,
        examName: reportCard.exam?.name || '',
        examType: reportCard.exam?.type || '',
        subjects,
        attendance,
        totalMarks: reportCard.totalMarks,
        totalMaxMarks: reportCard.totalMaxMarks,
        overallPercentage: reportCard.overallPercentage,
        overallGrade: reportCard.overallGrade,
        result: reportCard.result as ResultStatus,
        rank: reportCard.rank,
        remarks: reportCard.remarks,
        status: reportCard.status as ReportStatus,
        generatedAt: reportCard.generatedAt?.toISOString() || null,
        publishedAt: reportCard.publishedAt?.toISOString() || null,
    };
}
