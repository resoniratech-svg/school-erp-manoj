/**
 * Marks Types
 */

export interface MarksEntryResponse {
    id: string;
    examScheduleId: string;
    studentId: string;
    marksObtained: number;
    isAbsent: boolean;
    remarks: string | null;
    grade: string | null;
    percentage: number | null;
    createdAt: string;
    updatedAt: string;
    student?: {
        id: string;
        firstName: string;
        lastName: string;
        rollNumber: string | null;
    };
}

export interface BulkMarksEntry {
    studentId: string;
    marksObtained: number;
    isAbsent?: boolean;
    remarks?: string;
}

export interface BulkEnterMarksInput {
    examScheduleId: string;
    entries: BulkMarksEntry[];
}

export interface UpdateMarksInput {
    marksObtained?: number;
    isAbsent?: boolean;
    remarks?: string | null;
}

export interface MarksContext {
    tenantId: string;
    branchId: string;
    userId: string;
}

export interface StudentResult {
    studentId: string;
    studentName: string;
    subjects: Array<{
        subjectId: string;
        subjectName: string;
        maxMarks: number;
        marksObtained: number;
        percentage: number;
        grade: string;
        isAbsent: boolean;
    }>;
    totalMarks: number;
    totalMaxMarks: number;
    overallPercentage: number;
    overallGrade: string;
}
