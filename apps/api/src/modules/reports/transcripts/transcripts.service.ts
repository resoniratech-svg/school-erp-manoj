/**
 * Transcripts Service
 */
import { NotFoundError } from '@school-erp/shared';
import { reportsRepository } from '../reports.repository';
import { REPORT_ERROR_CODES, RESULT_STATUS } from '../reports.constants';
import type { TranscriptData, AcademicYearRecord } from './transcripts.types';
import type { ResultStatus } from '../reports.constants';
import type { ReportContext } from '../reports.types';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

export class TranscriptsService {
    /**
     * Generate transcript for a student
     */
    async generateTranscript(
        studentId: string,
        context: ReportContext
    ): Promise<TranscriptData> {
        // Validate student
        const student = await reportsRepository.findStudentById(studentId, context.tenantId);
        if (!student) {
            throw new NotFoundError('Student not found', {
                code: REPORT_ERROR_CODES.STUDENT_NOT_FOUND,
            });
        }

        // Get all published report cards
        const reportCards = await reportsRepository.findAllStudentReportCards(
            studentId,
            context.tenantId
        );

        // Group by academic year
        const academicYearMap = new Map<string, AcademicYearRecord>();

        for (const rc of reportCards) {
            const yearId = rc.academicYearId;

            if (!academicYearMap.has(yearId)) {
                academicYearMap.set(yearId, {
                    academicYearId: yearId,
                    academicYearName: rc.academicYear?.name || '',
                    classId: rc.classId,
                    className: rc.class?.name || '',
                    sectionId: rc.sectionId,
                    sectionName: rc.section?.name || '',
                    exams: [],
                    finalResult: RESULT_STATUS.PASS,
                    promoted: true,
                });
            }

            const yearRecord = academicYearMap.get(yearId)!;

            yearRecord.exams.push({
                examId: rc.examId,
                examName: rc.exam?.name || '',
                examType: rc.exam?.type || '',
                totalMarks: rc.totalMarks,
                totalMaxMarks: rc.totalMaxMarks,
                overallPercentage: rc.overallPercentage,
                overallGrade: rc.overallGrade,
                result: rc.result as ResultStatus,
            });

            // If any exam failed, year is failed
            if (rc.result === RESULT_STATUS.FAIL || rc.result === RESULT_STATUS.WITHHELD) {
                yearRecord.finalResult = rc.result as ResultStatus;
                yearRecord.promoted = false;
            }
        }

        const academicHistory = Array.from(academicYearMap.values());

        logger.info('Transcript generated', {
            studentId,
            academicYears: academicHistory.length,
            generatedBy: context.userId,
        });

        return {
            studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            rollNumber: student.rollNumber,
            academicHistory,
            currentStatus: student.status as 'active' | 'graduated' | 'transferred' | 'withdrawn',
            generatedAt: new Date().toISOString(),
        };
    }
}

export const transcriptsService = new TranscriptsService();
