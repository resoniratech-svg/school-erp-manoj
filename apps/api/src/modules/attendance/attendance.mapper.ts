/**
 * Attendance Mapper
 * Transform Prisma models to API response DTOs
 */
import type { AttendanceRecordResponse } from './attendance.types';
import type { AttendanceStatus } from './attendance.constants';

type AttendanceFromDb = {
    id: string;
    studentId: string;
    sectionId: string;
    academicYearId: string;
    date: Date;
    status: string;
    remarks: string | null;
    markedByUserId: string;
    createdAt: Date;
    updatedAt: Date;
    student?: {
        id: string;
        firstName: string;
        lastName: string;
        rollNumber: string | null;
    };
};

export function toAttendanceResponse(record: AttendanceFromDb): AttendanceRecordResponse {
    return {
        id: record.id,
        studentId: record.studentId,
        sectionId: record.sectionId,
        academicYearId: record.academicYearId,
        date: record.date.toISOString().split('T')[0],
        status: record.status as AttendanceStatus,
        remarks: record.remarks,
        markedByUserId: record.markedByUserId,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        ...(record.student && {
            student: {
                id: record.student.id,
                firstName: record.student.firstName,
                lastName: record.student.lastName,
                rollNumber: record.student.rollNumber,
            },
        }),
    };
}

export function toAttendanceResponseList(records: AttendanceFromDb[]): AttendanceRecordResponse[] {
    return records.map(toAttendanceResponse);
}
