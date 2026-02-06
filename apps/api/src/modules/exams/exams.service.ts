/**
 * Exams Service
 */
import {
    NotFoundError,
    ConflictError,
    BadRequestError,
} from '@school-erp/shared';
import { examsRepository, ExamsRepository } from './exams.repository';
import { toExamResponse } from './exams.mapper';
import { EXAM_ERROR_CODES, EXAM_STATUS } from './exams.constants';
import type { ExamResponse, ExamContext } from './exams.types';
import type { CreateExamInput, UpdateExamInput } from './exams.validator';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

export class ExamsService {
    constructor(private readonly repository: ExamsRepository = examsRepository) { }

    /**
     * Create a new exam
     */
    async createExam(
        input: CreateExamInput,
        context: ExamContext
    ): Promise<ExamResponse> {
        // Validate academic year
        const academicYear = await this.repository.findAcademicYearById(
            input.academicYearId,
            context.tenantId
        );
        if (!academicYear) {
            throw new NotFoundError('Academic year not found', {
                code: EXAM_ERROR_CODES.ACADEMIC_YEAR_NOT_FOUND,
            });
        }

        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        // Check for overlapping exams
        const overlapping = await this.repository.findOverlapping(
            context.tenantId,
            context.branchId,
            input.academicYearId,
            startDate,
            endDate
        );

        if (overlapping.length > 0) {
            throw new ConflictError(
                `Exam dates overlap with existing exam: ${overlapping[0].name}`,
                { code: EXAM_ERROR_CODES.OVERLAP }
            );
        }

        const exam = await this.repository.create({
            tenantId: context.tenantId,
            branchId: context.branchId,
            academicYearId: input.academicYearId,
            name: input.name,
            type: input.type,
            startDate,
            endDate,
            description: input.description,
        });

        logger.info('Exam created', {
            examId: exam.id,
            name: input.name,
            type: input.type,
            createdBy: context.userId,
        });

        return toExamResponse(exam);
    }

    /**
     * Get exam by ID
     */
    async getExamById(id: string, context: ExamContext): Promise<ExamResponse> {
        const exam = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!exam) {
            throw new NotFoundError('Exam not found', {
                code: EXAM_ERROR_CODES.NOT_FOUND,
            });
        }
        return toExamResponse(exam);
    }

    /**
     * List exams with filters
     */
    async listExams(
        filters: { academicYearId?: string; type?: string; status?: string },
        context: ExamContext
    ): Promise<ExamResponse[]> {
        const exams = await this.repository.findMany(context.tenantId, context.branchId, filters);
        return exams.map(toExamResponse);
    }

    /**
     * Update exam
     */
    async updateExam(
        id: string,
        input: UpdateExamInput,
        context: ExamContext
    ): Promise<ExamResponse> {
        const exam = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!exam) {
            throw new NotFoundError('Exam not found', {
                code: EXAM_ERROR_CODES.NOT_FOUND,
            });
        }

        // Cannot edit published exams
        if (exam.status === EXAM_STATUS.PUBLISHED) {
            throw new BadRequestError('Cannot edit published exam', {
                code: EXAM_ERROR_CODES.CANNOT_EDIT_PUBLISHED,
            });
        }

        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;

        const updated = await this.repository.update(id, {
            name: input.name,
            type: input.type,
            startDate,
            endDate,
            description: input.description,
            status: input.status,
        });

        logger.info('Exam updated', {
            examId: id,
            updatedBy: context.userId,
        });

        return toExamResponse(updated);
    }

    /**
     * Publish exam (irreversible)
     */
    async publishExam(id: string, context: ExamContext): Promise<ExamResponse> {
        const exam = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!exam) {
            throw new NotFoundError('Exam not found', {
                code: EXAM_ERROR_CODES.NOT_FOUND,
            });
        }

        if (exam.status === EXAM_STATUS.PUBLISHED) {
            throw new BadRequestError('Exam is already published', {
                code: EXAM_ERROR_CODES.ALREADY_PUBLISHED,
            });
        }

        const updated = await this.repository.update(id, {
            status: EXAM_STATUS.PUBLISHED,
        });

        logger.info('Exam published', {
            examId: id,
            publishedBy: context.userId,
        });

        return toExamResponse(updated);
    }

    /**
     * Delete exam (soft delete)
     */
    async deleteExam(id: string, context: ExamContext): Promise<void> {
        const exam = await this.repository.findById(id, context.tenantId, context.branchId);
        if (!exam) {
            throw new NotFoundError('Exam not found', {
                code: EXAM_ERROR_CODES.NOT_FOUND,
            });
        }

        if (exam.status === EXAM_STATUS.PUBLISHED) {
            throw new BadRequestError('Cannot delete published exam', {
                code: EXAM_ERROR_CODES.CANNOT_EDIT_PUBLISHED,
            });
        }

        await this.repository.softDelete(id);

        logger.info('Exam deleted', {
            examId: id,
            deletedBy: context.userId,
        });
    }
}

export const examsService = new ExamsService();
