/**
 * Reports Repository
 */
import { db } from '@school-erp/database';

const reportCardSelectFields = {
    id: true,
    tenantId: true,
    branchId: true,
    studentId: true,
    examId: true,
    academicYearId: true,
    classId: true,
    sectionId: true,
    totalMarks: true,
    totalMaxMarks: true,
    overallPercentage: true,
    overallGrade: true,
    result: true,
    rank: true,
    remarks: true,
    status: true,
    generatedAt: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
} as const;

const reportCardWithRelationsSelect = {
    ...reportCardSelectFields,
    student: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
        },
    },
    exam: {
        select: {
            id: true,
            name: true,
            type: true,
            status: true,
        },
    },
    class: {
        select: { id: true, name: true },
    },
    section: {
        select: { id: true, name: true },
    },
    academicYear: {
        select: { id: true, name: true },
    },
} as const;

export class ReportsRepository {
    /**
     * Find report card by ID
     */
    async findById(id: string, tenantId: string, branchId: string) {
        return db.reportCard.findFirst({
            where: { id, tenantId, branchId },
            select: reportCardWithRelationsSelect,
        });
    }

    /**
     * Find existing report card
     */
    async findByStudentExam(studentId: string, examId: string) {
        return db.reportCard.findFirst({
            where: { studentId, examId },
            select: reportCardSelectFields,
        });
    }

    /**
     * Find report cards with filters
     */
    async findMany(
        tenantId: string,
        branchId: string,
        filters?: {
            studentId?: string;
            examId?: string;
            academicYearId?: string;
            classId?: string;
        }
    ) {
        return db.reportCard.findMany({
            where: {
                tenantId,
                branchId,
                ...(filters?.studentId && { studentId: filters.studentId }),
                ...(filters?.examId && { examId: filters.examId }),
                ...(filters?.academicYearId && { academicYearId: filters.academicYearId }),
                ...(filters?.classId && { classId: filters.classId }),
            },
            select: reportCardWithRelationsSelect,
            orderBy: [{ createdAt: 'desc' }],
        });
    }

    /**
     * Create report card
     */
    async create(data: {
        tenantId: string;
        branchId: string;
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
        rank?: number;
        generatedByUserId: string;
    }) {
        return db.reportCard.create({
            data: {
                ...data,
                status: 'generated',
                generatedAt: new Date(),
            },
            select: reportCardWithRelationsSelect,
        });
    }

    /**
     * Update report card
     */
    async update(id: string, data: {
        status?: string;
        remarks?: string;
        publishedAt?: Date;
        rank?: number;
    }) {
        return db.reportCard.update({
            where: { id },
            data,
            select: reportCardWithRelationsSelect,
        });
    }

    // Data aggregation helpers
    async findStudentById(studentId: string, tenantId: string) {
        return db.student.findFirst({
            where: { id: studentId, tenantId, deletedAt: null },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                rollNumber: true,
                status: true,
            },
        });
    }

    async findExamById(examId: string, tenantId: string, branchId: string) {
        return db.exam.findFirst({
            where: { id: examId, tenantId, branchId, deletedAt: null },
            select: {
                id: true,
                name: true,
                type: true,
                status: true,
                academicYearId: true,
            },
        });
    }

    async findStudentEnrollment(studentId: string, academicYearId: string) {
        return db.studentEnrollment.findFirst({
            where: {
                studentId,
                academicYearId,
                status: 'active',
            },
            select: {
                id: true,
                sectionId: true,
                section: {
                    select: {
                        id: true,
                        name: true,
                        classId: true,
                        class: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });
    }

    async findStudentMarksForExam(studentId: string, examId: string) {
        return db.examMarks.findMany({
            where: {
                studentId,
                examSchedule: { examId },
            },
            select: {
                id: true,
                marksObtained: true,
                isAbsent: true,
                grade: true,
                percentage: true,
                examSchedule: {
                    select: {
                        id: true,
                        maxMarks: true,
                        passingMarks: true,
                        subjectId: true,
                        subject: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findClassSubjectMappings(classId: string) {
        return db.classSubject.findMany({
            where: { classId },
            select: {
                subjectId: true,
                isMandatory: true,
            },
        });
    }

    async findStudentAttendance(studentId: string, academicYearId: string) {
        return db.attendanceRecord.findMany({
            where: { studentId, academicYearId },
            select: { status: true },
        });
    }

    async findAcademicYearById(academicYearId: string, tenantId: string) {
        return db.academicYear.findFirst({
            where: { id: academicYearId, tenantId },
            select: { id: true, name: true },
        });
    }

    // For transcripts - all academic years
    async findAllStudentReportCards(studentId: string, tenantId: string) {
        return db.reportCard.findMany({
            where: {
                studentId,
                tenantId,
                status: 'published',
            },
            select: reportCardWithRelationsSelect,
            orderBy: [{ academicYear: { startDate: 'asc' } }, { exam: { startDate: 'asc' } }],
        });
    }

    async findStudentsByClass(classId: string, sectionId?: string) {
        return db.studentEnrollment.findMany({
            where: {
                section: { classId },
                ...(sectionId && { sectionId }),
                status: 'active',
            },
            select: {
                studentId: true,
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        rollNumber: true,
                    },
                },
            },
        });
    }
}

export const reportsRepository = new ReportsRepository();
