/**
 * Timetable Mapper
 * Transform Prisma models to API response DTOs
 */
import type { TimetableResponse, TimetableEntryResponse } from './timetable.types';
import type { DayOfWeek } from './timetable.constants';

type TimetableFromDb = {
    id: string;
    academicYearId: string;
    classId: string;
    sectionId: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
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
    entries: Array<{
        id: string;
        dayOfWeek: string;
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
    }>;
};

export function toTimetableEntryResponse(entry: {
    id: string;
    dayOfWeek: string;
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
}): TimetableEntryResponse {
    return {
        id: entry.id,
        dayOfWeek: entry.dayOfWeek as DayOfWeek,
        periodId: entry.periodId,
        subjectId: entry.subjectId,
        teacherId: entry.teacherId,
        period: entry.period,
        subject: entry.subject,
        teacher: entry.teacher,
    };
}

export function toTimetableResponse(timetable: TimetableFromDb): TimetableResponse {
    return {
        id: timetable.id,
        academicYearId: timetable.academicYearId,
        classId: timetable.classId,
        sectionId: timetable.sectionId,
        effectiveFrom: timetable.effectiveFrom.toISOString().split('T')[0],
        effectiveTo: timetable.effectiveTo?.toISOString().split('T')[0] ?? null,
        isActive: timetable.isActive,
        createdAt: timetable.createdAt.toISOString(),
        updatedAt: timetable.updatedAt.toISOString(),
        class: timetable.class,
        section: timetable.section,
        entries: timetable.entries.map(toTimetableEntryResponse),
    };
}
