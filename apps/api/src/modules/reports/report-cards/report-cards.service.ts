/**
 * Report Cards Service
 */
import { reportsRepository } from '../reports.repository';
import { reportsService, ReportsService } from '../reports.service';
import type { BulkGenerateResult } from './report-cards.types';
import type { ReportContext, ReportCardData } from '../reports.types';
import type { BulkGenerateInput } from '../reports.validator';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

export class ReportCardsService {
    constructor(
        private readonly service: ReportsService = reportsService
    ) { }

    /**
     * Bulk generate report cards for class/section
     */
    async bulkGenerate(
        input: BulkGenerateInput,
        context: ReportContext
    ): Promise<BulkGenerateResult> {
        // Get all students in class/section
        const enrollments = await reportsRepository.findStudentsByClass(
            input.classId,
            input.sectionId
        );

        const result: BulkGenerateResult = {
            generated: 0,
            failed: 0,
            errors: [],
        };

        for (const enrollment of enrollments) {
            try {
                await this.service.generateReportCard(
                    {
                        studentId: enrollment.studentId,
                        examId: input.examId,
                        academicYearId: input.academicYearId,
                    },
                    context
                );
                result.generated++;
            } catch (error) {
                result.failed++;
                result.errors.push({
                    studentId: enrollment.studentId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        logger.info('Bulk report cards generated', {
            classId: input.classId,
            examId: input.examId,
            generated: result.generated,
            failed: result.failed,
            generatedBy: context.userId,
        });

        return result;
    }

    /**
     * Get report card with full details
     */
    async getReportCard(id: string, context: ReportContext): Promise<ReportCardData> {
        return this.service.getReportCardById(id, context);
    }

    /**
     * Publish report card
     */
    async publish(id: string, remarks: string | undefined, context: ReportContext): Promise<ReportCardData> {
        return this.service.publishReportCard(id, remarks, context);
    }
}

export const reportCardsService = new ReportCardsService();
