/**
 * Reports Service
 */
import {
    NotFoundError,
    BadRequestError,
} from '@school-erp/shared';
import { reportsRepository, ReportsRepository } from './reports.repository';
import { toReportCardResponse } from './reports.mapper';
import {
    REPORT_ERROR_CODES,
    REPORT_STATUS,
    RESULT_STATUS,
    ATTENDANCE_THRESHOLD_PERCENTAGE,
} from './reports.constants';
import { gradesService } from '../exams/grades';
import { EXAM_STATUS } from '../exams/exams.constants';
import type {
    ReportCardData,
    SubjectResult,
    AttendanceSummary,
    ReportContext,
} from './reports.types';
import type { GenerateReportCardInput } from './reports.validator';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

export class ReportsService {
    constructor(private readonly repository: ReportsRepository = reportsRepository) { }

    /**
     * Calculate attendance summary
     */
    private calculateAttendance(
        attendanceRecords: Array<{ status: string }>
    ): AttendanceSummary {
        const totalDays = attendanceRecords.length;
        let presentDays = 0;
        let absentDays = 0;

        for (const record of attendanceRecords) {
            if (record.status === 'present' || record.status === 'late') {
                presentDays++;
            } else if (record.status === 'half_day') {
                presentDays += 0.5;
            } else if (record.status === 'absent') {
                absentDays++;
            }
        }

        const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;
        const isEligible = percentage >= ATTENDANCE_THRESHOLD_PERCENTAGE;

        return {
            totalDays,
            presentDays: Math.round(presentDays),
            absentDays,
            percentage: Math.round(percentage * 100) / 100,
            isEligible,
        };
    }

    /**
     * Determine overall result
     */
    private determineResult(
        subjects: SubjectResult[],
        attendanceEligible: boolean
    ): string {
        // Attendance not eligible -> WITHHELD
        if (!attendanceEligible) {
            return RESULT_STATUS.WITHHELD;
        }

        // Check if failed in any mandatory subject
        const failedMandatory = subjects.some(
            (s) => s.isMandatory && !s.isPassing
        );

        if (failedMandatory) {
            return RESULT_STATUS.FAIL;
        }

        // Check if failed in more than 2 subjects overall
        const totalFailed = subjects.filter((s) => !s.isPassing).length;
        if (totalFailed > 2) {
            return RESULT_STATUS.FAIL;
        }

        return RESULT_STATUS.PASS;
    }

    /**
     * Generate report card for a student
     */
    async generateReportCard(
        input: GenerateReportCardInput,
        context: ReportContext
    ): Promise<ReportCardData> {
        // Validate student
        const student = await this.repository.findStudentById(input.studentId, context.tenantId);
        if (!student) {
            throw new NotFoundError('Student not found', {
                code: REPORT_ERROR_CODES.STUDENT_NOT_FOUND,
            });
        }

        // Validate exam
        const exam = await this.repository.findExamById(
            input.examId,
            context.tenantId,
            context.branchId
        );
        if (!exam) {
            throw new NotFoundError('Exam not found');
        }

        // Exam must be published
        if (exam.status !== EXAM_STATUS.PUBLISHED) {
            throw new BadRequestError('Cannot generate report card for unpublished exam', {
                code: REPORT_ERROR_CODES.EXAM_NOT_PUBLISHED,
            });
        }

        // Get enrollment info
        const enrollment = await this.repository.findStudentEnrollment(
            input.studentId,
            input.academicYearId
        );
        if (!enrollment) {
            throw new BadRequestError('Student not enrolled in this academic year');
        }

        // Check if report already exists
        const existing = await this.repository.findByStudentExam(input.studentId, input.examId);
        if (existing) {
            // Return existing if already generated
            const existingFull = await this.repository.findById(
                existing.id,
                context.tenantId,
                context.branchId
            );
            if (existingFull) {
                return toReportCardResponse(existingFull);
            }
        }

        // Get marks for this exam
        const marksEntries = await this.repository.findStudentMarksForExam(
            input.studentId,
            input.examId
        );

        if (marksEntries.length === 0) {
            throw new BadRequestError('No marks found for this student in this exam', {
                code: REPORT_ERROR_CODES.NO_MARKS_FOUND,
            });
        }

        // Get class-subject mappings for mandatory info
        const classId = enrollment.section.classId;
        const classSubjects = await this.repository.findClassSubjectMappings(classId);
        const mandatorySubjects = new Set(
            classSubjects.filter((cs) => cs.isMandatory).map((cs) => cs.subjectId)
        );

        // Build subject results
        const subjects: SubjectResult[] = marksEntries.map((entry) => {
            const isPassing = entry.marksObtained >= entry.examSchedule.passingMarks;
            return {
                subjectId: entry.examSchedule.subjectId,
                subjectName: entry.examSchedule.subject.name,
                subjectCode: entry.examSchedule.subject.code,
                isMandatory: mandatorySubjects.has(entry.examSchedule.subjectId),
                maxMarks: entry.examSchedule.maxMarks,
                marksObtained: entry.isAbsent ? 0 : entry.marksObtained,
                percentage: entry.percentage || 0,
                grade: entry.grade || 'N/A',
                isPassing: !entry.isAbsent && isPassing,
            };
        });

        // Calculate totals
        const totalMarks = subjects.reduce((sum, s) => sum + s.marksObtained, 0);
        const totalMaxMarks = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
        const overallPercentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
        const overallGrade = gradesService.calculateGrade(overallPercentage);

        // Get attendance
        const attendanceRecords = await this.repository.findStudentAttendance(
            input.studentId,
            input.academicYearId
        );
        const attendance = this.calculateAttendance(attendanceRecords);

        // Determine result
        const result = this.determineResult(subjects, attendance.isEligible);

        // Create report card
        const reportCard = await this.repository.create({
            tenantId: context.tenantId,
            branchId: context.branchId,
            studentId: input.studentId,
            examId: input.examId,
            academicYearId: input.academicYearId,
            classId,
            sectionId: enrollment.sectionId,
            totalMarks,
            totalMaxMarks,
            overallPercentage: Math.round(overallPercentage * 100) / 100,
            overallGrade,
            result,
            generatedByUserId: context.userId,
        });

        logger.info('Report card generated', {
            reportCardId: reportCard.id,
            studentId: input.studentId,
            examId: input.examId,
            result,
            generatedBy: context.userId,
        });

        return toReportCardResponse(reportCard, subjects, attendance);
    }

    /**
     * Get report card by ID
     */
    async getReportCardById(
        id: string,
        context: ReportContext
    ): Promise<ReportCardData> {
        const reportCard = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!reportCard) {
            throw new NotFoundError('Report card not found', {
                code: REPORT_ERROR_CODES.NOT_FOUND,
            });
        }

        // Fetch additional data for full response
        const marksEntries = await this.repository.findStudentMarksForExam(
            reportCard.studentId,
            reportCard.examId
        );

        const classSubjects = await this.repository.findClassSubjectMappings(reportCard.classId);
        const mandatorySubjects = new Set(
            classSubjects.filter((cs) => cs.isMandatory).map((cs) => cs.subjectId)
        );

        const subjects: SubjectResult[] = marksEntries.map((entry) => ({
            subjectId: entry.examSchedule.subjectId,
            subjectName: entry.examSchedule.subject.name,
            subjectCode: entry.examSchedule.subject.code,
            isMandatory: mandatorySubjects.has(entry.examSchedule.subjectId),
            maxMarks: entry.examSchedule.maxMarks,
            marksObtained: entry.isAbsent ? 0 : entry.marksObtained,
            percentage: entry.percentage || 0,
            grade: entry.grade || 'N/A',
            isPassing: !entry.isAbsent && entry.marksObtained >= entry.examSchedule.passingMarks,
        }));

        const attendanceRecords = await this.repository.findStudentAttendance(
            reportCard.studentId,
            reportCard.academicYearId
        );
        const attendance = this.calculateAttendance(attendanceRecords);

        return toReportCardResponse(reportCard, subjects, attendance);
    }

    /**
     * List report cards
     */
    async listReportCards(
        filters: {
            studentId?: string;
            examId?: string;
            academicYearId?: string;
            classId?: string;
        },
        context: ReportContext
    ): Promise<ReportCardData[]> {
        const reportCards = await this.repository.findMany(
            context.tenantId,
            context.branchId,
            filters
        );
        return reportCards.map((rc) => toReportCardResponse(rc));
    }

    /**
     * Publish report card
     */
    async publishReportCard(
        id: string,
        remarks: string | undefined,
        context: ReportContext
    ): Promise<ReportCardData> {
        const reportCard = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!reportCard) {
            throw new NotFoundError('Report card not found', {
                code: REPORT_ERROR_CODES.NOT_FOUND,
            });
        }

        if (reportCard.status === REPORT_STATUS.PUBLISHED) {
            throw new BadRequestError('Report card is already published', {
                code: REPORT_ERROR_CODES.ALREADY_PUBLISHED,
            });
        }

        const updated = await this.repository.update(id, {
            status: REPORT_STATUS.PUBLISHED,
            remarks,
            publishedAt: new Date(),
        });

        logger.info('Report card published', {
            reportCardId: id,
            publishedBy: context.userId,
        });

        return toReportCardResponse(updated);
    }

    /**
     * Check promotion eligibility
     */
    async checkPromotionEligibility(
        studentId: string,
        academicYearId: string,
        context: ReportContext
    ): Promise<{
        isEligible: boolean;
        reasons: string[];
        passedExams: number;
        failedExams: number;
        attendancePercentage: number;
    }> {
        const reasons: string[] = [];

        // Get all published report cards for this student in academic year
        const reportCards = await this.repository.findMany(
            context.tenantId,
            context.branchId,
            { studentId, academicYearId }
        );

        const publishedCards = reportCards.filter((rc) => rc.status === REPORT_STATUS.PUBLISHED);

        if (publishedCards.length === 0) {
            return {
                isEligible: false,
                reasons: ['No published report cards found'],
                passedExams: 0,
                failedExams: 0,
                attendancePercentage: 0,
            };
        }

        const passedExams = publishedCards.filter((rc) => rc.result === RESULT_STATUS.PASS).length;
        const failedExams = publishedCards.filter(
            (rc) => rc.result === RESULT_STATUS.FAIL || rc.result === RESULT_STATUS.WITHHELD
        ).length;

        // Get attendance
        const attendanceRecords = await this.repository.findStudentAttendance(
            studentId,
            academicYearId
        );
        const attendance = this.calculateAttendance(attendanceRecords);

        // Check conditions
        if (failedExams > 0) {
            reasons.push(`Failed in ${failedExams} exam(s)`);
        }

        if (!attendance.isEligible) {
            reasons.push(`Attendance ${attendance.percentage}% is below required ${ATTENDANCE_THRESHOLD_PERCENTAGE}%`);
        }

        const isEligible = failedExams === 0 && attendance.isEligible;

        return {
            isEligible,
            reasons,
            passedExams,
            failedExams,
            attendancePercentage: attendance.percentage,
        };
    }
}

export const reportsService = new ReportsService();
