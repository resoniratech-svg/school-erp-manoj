/**
 * Fees Mapper
 */
import type {
    FeeStructureResponse,
    FeeAssignmentResponse,
    PaymentResponse,
} from './fees.types';
import type { FeeType, PaymentStatus, PaymentMode } from './fees.constants';

type FeeStructureFromDb = {
    id: string;
    name: string;
    feeType: string;
    amount: number;
    frequency: string;
    academicYearId: string;
    classId: string | null;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};

type FeeAssignmentFromDb = {
    id: string;
    studentId: string;
    feeStructureId: string;
    academicYearId: string;
    totalAmount: number;
    discountAmount: number;
    netAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
    dueDate: Date | null;
    createdAt: Date;
    student?: {
        id: string;
        firstName: string;
        lastName: string;
        rollNumber: string | null;
    };
    feeStructure?: {
        id: string;
        name: string;
        feeType: string;
    };
};

type PaymentFromDb = {
    id: string;
    feeAssignmentId: string;
    amount: number;
    paymentMode: string;
    receiptNumber: string;
    transactionRef: string | null;
    paymentDate: Date;
    remarks: string | null;
    recordedByUserId: string;
    createdAt: Date;
};

export function toFeeStructureResponse(structure: FeeStructureFromDb): FeeStructureResponse {
    return {
        id: structure.id,
        name: structure.name,
        feeType: structure.feeType as FeeType,
        amount: structure.amount,
        frequency: structure.frequency as FeeStructureResponse['frequency'],
        academicYearId: structure.academicYearId,
        classId: structure.classId,
        description: structure.description,
        isActive: structure.isActive,
        createdAt: structure.createdAt.toISOString(),
        updatedAt: structure.updatedAt.toISOString(),
    };
}

export function toFeeAssignmentResponse(assignment: FeeAssignmentFromDb): FeeAssignmentResponse {
    return {
        id: assignment.id,
        studentId: assignment.studentId,
        feeStructureId: assignment.feeStructureId,
        academicYearId: assignment.academicYearId,
        totalAmount: assignment.totalAmount,
        discountAmount: assignment.discountAmount,
        netAmount: assignment.netAmount,
        paidAmount: assignment.paidAmount,
        balanceAmount: assignment.balanceAmount,
        status: assignment.status as PaymentStatus,
        dueDate: assignment.dueDate?.toISOString().split('T')[0] || null,
        createdAt: assignment.createdAt.toISOString(),
        student: assignment.student,
        feeStructure: assignment.feeStructure
            ? {
                id: assignment.feeStructure.id,
                name: assignment.feeStructure.name,
                feeType: assignment.feeStructure.feeType as FeeType,
            }
            : undefined,
    };
}

export function toPaymentResponse(payment: PaymentFromDb): PaymentResponse {
    return {
        id: payment.id,
        feeAssignmentId: payment.feeAssignmentId,
        amount: payment.amount,
        paymentMode: payment.paymentMode as PaymentMode,
        receiptNumber: payment.receiptNumber,
        transactionRef: payment.transactionRef,
        paymentDate: payment.paymentDate.toISOString().split('T')[0],
        remarks: payment.remarks,
        recordedByUserId: payment.recordedByUserId,
        createdAt: payment.createdAt.toISOString(),
    };
}
