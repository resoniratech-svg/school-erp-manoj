/**
 * Timetable Types
 */
import type { DayOfWeek } from './timetable.constants';

export interface TimetableEntryResponse {
    id: string;
    dayOfWeek: DayOfWeek;
    periodId: string;
    subjectId: string;
    teacherId: string;
    period: {
        id: string;
        name: string;
        startTime: string;
        endTime: string;
    };
    subject: {
        id: string;
        name: string;
        code: string;
    };
    teacher: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface TimetableResponse {
    id: string;
    academicYearId: string;
    classId: string;
    sectionId: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    class: {
        id: string;
        name: string;
        code: string;
    };
    section: {
        id: string;
        name: string;
        code: string;
    };
    entries: TimetableEntryResponse[];
}

export interface CreateTimetableInput {
    academicYearId: string;
    classId: string;
    sectionId: string;
    effectiveFrom: string;
    effectiveTo?: string;
}

export interface CreateTimetableEntryInput {
    dayOfWeek: DayOfWeek;
    periodId: string;
    subjectId: string;
    teacherId: string;
}

export interface UpdateTimetableInput {
    effectiveFrom?: string;
    effectiveTo?: string | null;
    isActive?: boolean;
}

export interface TimetableContext {
    tenantId: string;
    branchId: string;
    userId: string;
}

export interface ConflictCheckResult {
    hasConflict: boolean;
    conflictType?: 'teacher' | 'section';
    conflictDetails?: string;
}
