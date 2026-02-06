/**
 * Exam Schedules Types
 */

export interface ExamScheduleResponse {
    id: string;
    examId: string;
    classId: string;
    subjectId: string;
    date: string;
    startTime: string;
    endTime: string;
    maxMarks: number;
    passingMarks: number;
    createdAt: string;
    class?: {
        id: string;
        name: string;
    };
    subject?: {
        id: string;
        name: string;
        code: string;
    };
}

export interface CreateScheduleInput {
    examId: string;
    classId: string;
    subjectId: string;
    date: string;
    startTime: string;
    endTime: string;
    maxMarks: number;
    passingMarks: number;
}

export interface UpdateScheduleInput {
    date?: string;
    startTime?: string;
    endTime?: string;
    maxMarks?: number;
    passingMarks?: number;
}

export interface ScheduleContext {
    tenantId: string;
    branchId: string;
    userId: string;
}
