/**
 * Fees Repository
 * CRITICAL: Audit-safe operations with transactions
 */
import { db } from '@school-erp/database';
import type { Prisma } from '@prisma/client';

const feeStructureSelectFields = {
    id: true,
    tenantId: true,
    name: true,
    feeType: true,
    amount: true,
    frequency: true,
    academicYearId: true,
    classId: true,
    description: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
} as const;

const feeAssignmentSelectFields = {
    id: true,
    tenantId: true,
    branchId: true,
    studentId: true,
    feeStructureId: true,
    academicYearId: true,
    totalAmount: true,
    discountAmount: true,
    netAmount: true,
    paidAmount: true,
    balanceAmount: true,
    status: true,
    dueDate: true,
    createdAt: true,
    updatedAt: true,
} as const;

const feeAssignmentWithRelationsSelect = {
    ...feeAssignmentSelectFields,
    student: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
        },
    },
    feeStructure: {
        select: {
            id: true,
            name: true,
            feeType: true,
        },
    },
} as const;

const paymentSelectFields = {
    id: true,
    feeAssignmentId: true,
    amount: true,
    paymentMode: true,
    receiptNumber: true,
    transactionRef: true,
    paymentDate: true,
    remarks: true,
    recordedByUserId: true,
    createdAt: true,
} as const;

export class FeesRepository {
    // ==================== FEE STRUCTURES ====================

    async findStructureById(id: string, tenantId: string) {
        return db.feeStructure.findFirst({
            where: { id, tenantId, deletedAt: null },
            select: feeStructureSelectFields,
        });
    }

    async findStructures(tenantId: string, filters?: {
        academicYearId?: string;
        classId?: string;
        feeType?: string;
    }) {
        return db.feeStructure.findMany({
            where: {
                tenantId,
                deletedAt: null,
                ...(filters?.academicYearId && { academicYearId: filters.academicYearId }),
                ...(filters?.classId && { classId: filters.classId }),
                ...(filters?.feeType && { feeType: filters.feeType }),
            },
            select: feeStructureSelectFields,
            orderBy: { createdAt: 'desc' },
        });
    }

    async createStructure(data: {
        tenantId: string;
        name: string;
        feeType: string;
        amount: number;
        frequency: string;
        academicYearId: string;
        classId?: string;
        description?: string;
    }) {
        return db.feeStructure.create({
            data: { ...data, isActive: true },
            select: feeStructureSelectFields,
        });
    }

    async updateStructure(id: string, data: {
        name?: string;
        amount?: number;
        description?: string | null;
        isActive?: boolean;
    }) {
        return db.feeStructure.update({
            where: { id },
            data,
            select: feeStructureSelectFields,
        });
    }

    async softDeleteStructure(id: string) {
        return db.feeStructure.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
            select: feeStructureSelectFields,
        });
    }

    // ==================== FEE ASSIGNMENTS ====================

    async findAssignmentById(id: string, tenantId: string, branchId: string) {
        return db.feeAssignment.findFirst({
            where: { id, tenantId, branchId },
            select: feeAssignmentWithRelationsSelect,
        });
    }

    async findExistingAssignment(studentId: string, feeStructureId: string, academicYearId: string) {
        return db.feeAssignment.findFirst({
            where: { studentId, feeStructureId, academicYearId },
            select: feeAssignmentSelectFields,
        });
    }

    async findAssignments(tenantId: string, branchId: string, filters?: {
        studentId?: string;
        academicYearId?: string;
        status?: string;
    }) {
        return db.feeAssignment.findMany({
            where: {
                tenantId,
                branchId,
                ...(filters?.studentId && { studentId: filters.studentId }),
                ...(filters?.academicYearId && { academicYearId: filters.academicYearId }),
                ...(filters?.status && { status: filters.status }),
            },
            select: feeAssignmentWithRelationsSelect,
            orderBy: { createdAt: 'desc' },
        });
    }

    async createAssignment(data: {
        tenantId: string;
        branchId: string;
        studentId: string;
        feeStructureId: string;
        academicYearId: string;
        totalAmount: number;
        discountAmount: number;
        netAmount: number;
        dueDate?: Date;
    }) {
        return db.feeAssignment.create({
            data: {
                ...data,
                paidAmount: 0,
                balanceAmount: data.netAmount,
                status: 'pending',
            },
            select: feeAssignmentWithRelationsSelect,
        });
    }

    // ==================== PAYMENTS (APPEND-ONLY) ====================

    async findPaymentById(id: string) {
        return db.feePayment.findUnique({
            where: { id },
            select: paymentSelectFields,
        });
    }

    async findPaymentByReceiptNumber(receiptNumber: string, tenantId: string) {
        return db.feePayment.findFirst({
            where: {
                receiptNumber,
                feeAssignment: { tenantId },
            },
            select: paymentSelectFields,
        });
    }

    async findPayments(tenantId: string, branchId: string, filters?: {
        feeAssignmentId?: string;
        studentId?: string;
        fromDate?: Date;
        toDate?: Date;
    }) {
        return db.feePayment.findMany({
            where: {
                feeAssignment: {
                    tenantId,
                    branchId,
                    ...(filters?.studentId && { studentId: filters.studentId }),
                },
                ...(filters?.feeAssignmentId && { feeAssignmentId: filters.feeAssignmentId }),
                ...(filters?.fromDate && filters?.toDate && {
                    paymentDate: {
                        gte: filters.fromDate,
                        lte: filters.toDate,
                    },
                }),
            },
            select: {
                ...paymentSelectFields,
                feeAssignment: {
                    select: {
                        studentId: true,
                        student: {
                            select: { firstName: true, lastName: true, rollNumber: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * CRITICAL: Record payment and update balance in transaction
     * Append-only - never delete payments
     */
    async recordPaymentWithBalanceUpdate(
        paymentData: {
            feeAssignmentId: string;
            amount: number;
            paymentMode: string;
            receiptNumber: string;
            transactionRef?: string;
            paymentDate: Date;
            remarks?: string;
            recordedByUserId: string;
        },
        assignmentId: string
    ) {
        return db.$transaction(async (tx: Prisma.TransactionClient) => {
            // Get current assignment with lock
            const assignment = await tx.feeAssignment.findUnique({
                where: { id: assignmentId },
                select: { balanceAmount: true, paidAmount: true, netAmount: true },
            });

            if (!assignment) {
                throw new Error('Assignment not found');
            }

            // Create payment record (append-only)
            const payment = await tx.feePayment.create({
                data: paymentData,
                select: paymentSelectFields,
            });

            // Calculate new amounts
            const newPaidAmount = assignment.paidAmount + paymentData.amount;
            const newBalanceAmount = assignment.netAmount - newPaidAmount;

            // Determine status
            let status = 'partial';
            if (newBalanceAmount <= 0) {
                status = 'paid';
            } else if (newPaidAmount === 0) {
                status = 'pending';
            }

            // Update assignment balance
            await tx.feeAssignment.update({
                where: { id: assignmentId },
                data: {
                    paidAmount: newPaidAmount,
                    balanceAmount: Math.max(0, newBalanceAmount),
                    status,
                },
            });

            return payment;
        });
    }

    // ==================== HELPERS ====================

    async findStudentById(studentId: string, tenantId: string) {
        return db.student.findFirst({
            where: { id: studentId, tenantId, deletedAt: null },
            select: { id: true, firstName: true, lastName: true, status: true },
        });
    }

    async findAcademicYearById(academicYearId: string, tenantId: string) {
        return db.academicYear.findFirst({
            where: { id: academicYearId, tenantId },
            select: { id: true, name: true },
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
                    select: { id: true, tenantId: true },
                },
            },
        });
    }

    async generateReceiptNumber(tenantId: string): Promise<string> {
        const count = await db.feePayment.count({
            where: {
                feeAssignment: { tenantId },
            },
        });
        const year = new Date().getFullYear();
        return `RCP-${year}-${String(count + 1).padStart(6, '0')}`;
    }

    // ==================== REPORTS ====================

    async getCollectionSummary(tenantId: string, branchId: string, academicYearId: string) {
        const assignments = await db.feeAssignment.findMany({
            where: { tenantId, branchId, academicYearId },
            select: {
                paidAmount: true,
                balanceAmount: true,
                status: true,
            },
        });

        return {
            totalCollected: assignments.reduce((sum, a) => sum + a.paidAmount, 0),
            totalPending: assignments.reduce((sum, a) => sum + a.balanceAmount, 0),
            totalStudents: assignments.length,
            paidCount: assignments.filter((a) => a.status === 'paid').length,
            partialCount: assignments.filter((a) => a.status === 'partial').length,
            pendingCount: assignments.filter((a) => a.status === 'pending').length,
            overdueCount: assignments.filter((a) => a.status === 'overdue').length,
        };
    }

    async getDefaulters(tenantId: string, branchId: string, academicYearId: string) {
        return db.feeAssignment.findMany({
            where: {
                tenantId,
                branchId,
                academicYearId,
                balanceAmount: { gt: 0 },
                dueDate: { lt: new Date() },
            },
            select: {
                studentId: true,
                balanceAmount: true,
                dueDate: true,
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        rollNumber: true,
                    },
                },
            },
            orderBy: { balanceAmount: 'desc' },
        });
    }
}

export const feesRepository = new FeesRepository();
