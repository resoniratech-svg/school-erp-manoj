/**
 * Academic Years Mapper
 * Transform Prisma models to API response DTOs
 */
import type { AcademicYearResponse } from './academic-years.types';

type AcademicYearFromDb = {
    id: string;
    tenantId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
};

export function toAcademicYearResponse(academicYear: AcademicYearFromDb): AcademicYearResponse {
    return {
        id: academicYear.id,
        name: academicYear.name,
        startDate: academicYear.startDate.toISOString().split('T')[0],
        endDate: academicYear.endDate.toISOString().split('T')[0],
        isCurrent: academicYear.isCurrent,
        status: academicYear.status as AcademicYearResponse['status'],
        createdAt: academicYear.createdAt.toISOString(),
        updatedAt: academicYear.updatedAt.toISOString(),
    };
}

export function toAcademicYearResponseList(
    academicYears: AcademicYearFromDb[]
): AcademicYearResponse[] {
    return academicYears.map(toAcademicYearResponse);
}
