/**
 * Fees Service
 * CRITICAL: Audit-safe financial operations
 */
import {
    NotFoundError,
    ConflictError,
    BadRequestError,
} from '@school-erp/shared';
import { feesRepository, FeesRepository } from './fees.repository';
import {
    toFeeStructureResponse,
    toFeeAssignmentResponse,
    toPaymentResponse,
} from './fees.mapper';
import { FEES_ERROR_CODES } from './fees.constants';
import type {
    FeeStructureResponse,
    FeeAssignmentResponse,
    PaymentResponse,
    FeesContext,
    CollectionReport,
    DefaulterInfo,
} from './fees.types';
import type {
    CreateFeeStructureInput,
    UpdateFeeStructureInput,
    AssignFeeInput,
    BulkAssignFeeInput,
    RecordPaymentInput,
} from './fees.validator';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

export class FeesService {
    constructor(private readonly repository: FeesRepository = feesRepository) { }

    // ==================== FEE STRUCTURES ====================

    async createFeeStructure(
        input: CreateFeeStructureInput,
        context: FeesContext
    ): Promise<FeeStructureResponse> {
        // Verify academic year exists
        const academicYear = await this.repository.findAcademicYearById(
            input.academicYearId,
            context.tenantId
        );
        if (!academicYear) {
            throw new NotFoundError('Academic year not found', {
                code: FEES_ERROR_CODES.ACADEMIC_YEAR_NOT_FOUND,
            });
        }

        const structure = await this.repository.createStructure({
            tenantId: context.tenantId,
            name: input.name,
            feeType: input.feeType,
            amount: input.amount,
            frequency: input.frequency,
            academicYearId: input.academicYearId,
            classId: input.classId,
            description: input.description,
        });

        logger.info('Fee structure created', {
            structureId: structure.id,
            name: input.name,
            amount: input.amount,
            createdBy: context.userId,
        });

        return toFeeStructureResponse(structure);
    }

    async getFeeStructureById(id: string, context: FeesContext): Promise<FeeStructureResponse> {
        const structure = await this.repository.findStructureById(id, context.tenantId);
        if (!structure) {
            throw new NotFoundError('Fee structure not found', {
                code: FEES_ERROR_CODES.STRUCTURE_NOT_FOUND,
            });
        }
        return toFeeStructureResponse(structure);
    }

    async listFeeStructures(
        filters: { academicYearId?: string; classId?: string; feeType?: string },
        context: FeesContext
    ): Promise<FeeStructureResponse[]> {
        const structures = await this.repository.findStructures(context.tenantId, filters);
        return structures.map(toFeeStructureResponse);
    }

    async updateFeeStructure(
        id: string,
        input: UpdateFeeStructureInput,
        context: FeesContext
    ): Promise<FeeStructureResponse> {
        const existing = await this.repository.findStructureById(id, context.tenantId);
        if (!existing) {
            throw new NotFoundError('Fee structure not found', {
                code: FEES_ERROR_CODES.STRUCTURE_NOT_FOUND,
            });
        }

        const updated = await this.repository.updateStructure(id, input);

        logger.info('Fee structure updated', {
            structureId: id,
            updatedBy: context.userId,
        });

        return toFeeStructureResponse(updated);
    }

    // ==================== FEE ASSIGNMENTS ====================

    async assignFee(
        input: AssignFeeInput,
        context: FeesContext
    ): Promise<FeeAssignmentResponse> {
        // Validate student
        const student = await this.repository.findStudentById(input.studentId, context.tenantId);
        if (!student) {
            throw new NotFoundError('Student not found', {
                code: FEES_ERROR_CODES.STUDENT_NOT_FOUND,
            });
        }

        // Validate fee structure
        const structure = await this.repository.findStructureById(
            input.feeStructureId,
            context.tenantId
        );
        if (!structure) {
            throw new NotFoundError('Fee structure not found', {
                code: FEES_ERROR_CODES.STRUCTURE_NOT_FOUND,
            });
        }

        // Check for duplicate assignment
        const existing = await this.repository.findExistingAssignment(
            input.studentId,
            input.feeStructureId,
            input.academicYearId
        );
        if (existing) {
            throw new ConflictError('Fee already assigned to this student', {
                code: FEES_ERROR_CODES.DUPLICATE_ASSIGNMENT,
            });
        }

        const totalAmount = structure.amount;
        const discountAmount = input.discountAmount || 0;
        const netAmount = totalAmount - discountAmount;

        const assignment = await this.repository.createAssignment({
            tenantId: context.tenantId,
            branchId: context.branchId,
            studentId: input.studentId,
            feeStructureId: input.feeStructureId,
            academicYearId: input.academicYearId,
            totalAmount,
            discountAmount,
            netAmount,
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        });

        logger.info('Fee assigned', {
            assignmentId: assignment.id,
            studentId: input.studentId,
            feeStructureId: input.feeStructureId,
            netAmount,
            assignedBy: context.userId,
        });

        return toFeeAssignmentResponse(assignment);
    }

    async bulkAssignFee(
        input: BulkAssignFeeInput,
        context: FeesContext
    ): Promise<{ assigned: number; skipped: number }> {
        const students = await this.repository.findStudentsByClass(input.classId, input.sectionId);

        const structure = await this.repository.findStructureById(
            input.feeStructureId,
            context.tenantId
        );
        if (!structure) {
            throw new NotFoundError('Fee structure not found', {
                code: FEES_ERROR_CODES.STRUCTURE_NOT_FOUND,
            });
        }

        let assigned = 0;
        let skipped = 0;

        for (const enrollment of students) {
            try {
                await this.assignFee(
                    {
                        studentId: enrollment.studentId,
                        feeStructureId: input.feeStructureId,
                        academicYearId: input.academicYearId,
                        dueDate: input.dueDate,
                    },
                    context
                );
                assigned++;
            } catch {
                skipped++; // Already assigned or other error
            }
        }

        logger.info('Bulk fee assignment completed', {
            classId: input.classId,
            assigned,
            skipped,
            assignedBy: context.userId,
        });

        return { assigned, skipped };
    }

    async getFeeAssignment(id: string, context: FeesContext): Promise<FeeAssignmentResponse> {
        const assignment = await this.repository.findAssignmentById(
            id,
            context.tenantId,
            context.branchId
        );
        if (!assignment) {
            throw new NotFoundError('Fee assignment not found', {
                code: FEES_ERROR_CODES.ASSIGNMENT_NOT_FOUND,
            });
        }
        return toFeeAssignmentResponse(assignment);
    }

    async listFeeAssignments(
        filters: { studentId?: string; academicYearId?: string; status?: string },
        context: FeesContext
    ): Promise<FeeAssignmentResponse[]> {
        const assignments = await this.repository.findAssignments(
            context.tenantId,
            context.branchId,
            filters
        );
        return assignments.map(toFeeAssignmentResponse);
    }

    // ==================== PAYMENTS (APPEND-ONLY) ====================

    /**
     * CRITICAL: Record payment - append-only, transactional
     */
    async recordPayment(
        input: RecordPaymentInput,
        context: FeesContext
    ): Promise<PaymentResponse> {
        // Validate assignment
        const assignment = await this.repository.findAssignmentById(
            input.feeAssignmentId,
            context.tenantId,
            context.branchId
        );
        if (!assignment) {
            throw new NotFoundError('Fee assignment not found', {
                code: FEES_ERROR_CODES.ASSIGNMENT_NOT_FOUND,
            });
        }

        // Validate amount
        if (input.amount <= 0) {
            throw new BadRequestError('Payment amount must be positive', {
                code: FEES_ERROR_CODES.INVALID_AMOUNT,
            });
        }

        // CRITICAL: Block overpayment
        if (input.amount > assignment.balanceAmount) {
            throw new BadRequestError(
                `Payment amount ${input.amount} exceeds balance ${assignment.balanceAmount}`,
                { code: FEES_ERROR_CODES.OVERPAYMENT }
            );
        }

        // Generate receipt number
        const receiptNumber = await this.repository.generateReceiptNumber(context.tenantId);

        // Check for duplicate receipt
        const existingReceipt = await this.repository.findPaymentByReceiptNumber(
            receiptNumber,
            context.tenantId
        );
        if (existingReceipt) {
            throw new ConflictError('Duplicate receipt number', {
                code: FEES_ERROR_CODES.DUPLICATE_RECEIPT,
            });
        }

        // CRITICAL: Record payment with balance update in transaction
        const payment = await this.repository.recordPaymentWithBalanceUpdate(
            {
                feeAssignmentId: input.feeAssignmentId,
                amount: input.amount,
                paymentMode: input.paymentMode,
                receiptNumber,
                transactionRef: input.transactionRef,
                paymentDate: new Date(input.paymentDate),
                remarks: input.remarks,
                recordedByUserId: context.userId,
            },
            input.feeAssignmentId
        );

        // AUDIT LOG
        logger.info('PAYMENT_RECORDED', {
            paymentId: payment.id,
            receiptNumber,
            feeAssignmentId: input.feeAssignmentId,
            studentId: assignment.studentId,
            amount: input.amount,
            paymentMode: input.paymentMode,
            recordedBy: context.userId,
            timestamp: new Date().toISOString(),
        });

        return toPaymentResponse(payment);
    }

    async getPayment(id: string): Promise<PaymentResponse> {
        const payment = await this.repository.findPaymentById(id);
        if (!payment) {
            throw new NotFoundError('Payment not found', {
                code: FEES_ERROR_CODES.PAYMENT_NOT_FOUND,
            });
        }
        return toPaymentResponse(payment);
    }

    async listPayments(
        filters: { feeAssignmentId?: string; studentId?: string; fromDate?: string; toDate?: string },
        context: FeesContext
    ): Promise<PaymentResponse[]> {
        const payments = await this.repository.findPayments(
            context.tenantId,
            context.branchId,
            {
                feeAssignmentId: filters.feeAssignmentId,
                studentId: filters.studentId,
                fromDate: filters.fromDate ? new Date(filters.fromDate) : undefined,
                toDate: filters.toDate ? new Date(filters.toDate) : undefined,
            }
        );
        return payments.map(toPaymentResponse);
    }

    // ==================== REPORTS ====================

    async getCollectionReport(
        academicYearId: string,
        context: FeesContext
    ): Promise<CollectionReport> {
        return this.repository.getCollectionSummary(
            context.tenantId,
            context.branchId,
            academicYearId
        );
    }

    async getDefaultersList(
        academicYearId: string,
        context: FeesContext
    ): Promise<DefaulterInfo[]> {
        const defaulters = await this.repository.getDefaulters(
            context.tenantId,
            context.branchId,
            academicYearId
        );

        return defaulters.map((d) => ({
            studentId: d.studentId,
            studentName: `${d.student.firstName} ${d.student.lastName}`,
            rollNumber: d.student.rollNumber,
            className: '', // Would need to join with enrollment
            sectionName: '',
            totalDue: d.balanceAmount,
            overdueDays: d.dueDate
                ? Math.floor((Date.now() - d.dueDate.getTime()) / (1000 * 60 * 60 * 24))
                : 0,
        }));
    }
}

export const feesService = new FeesService();
