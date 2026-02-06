/**
 * Fees Types
 */
import type { FeeType, InstallmentFrequency, PaymentStatus, PaymentMode } from './fees.constants';

export interface FeeStructureResponse {
    id: string;
    name: string;
    feeType: FeeType;
    amount: number;
    frequency: InstallmentFrequency;
    academicYearId: string;
    classId: string | null;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface FeeAssignmentResponse {
    id: string;
    studentId: string;
    feeStructureId: string;
    academicYearId: string;
    totalAmount: number;
    discountAmount: number;
    netAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: PaymentStatus;
    dueDate: string | null;
    createdAt: string;
    student?: {
        id: string;
        firstName: string;
        lastName: string;
        rollNumber: string | null;
    };
    feeStructure?: {
        id: string;
        name: string;
        feeType: FeeType;
    };
}

export interface PaymentResponse {
    id: string;
    feeAssignmentId: string;
    amount: number;
    paymentMode: PaymentMode;
    receiptNumber: string;
    transactionRef: string | null;
    paymentDate: string;
    remarks: string | null;
    recordedByUserId: string;
    createdAt: string;
}

export interface FeesContext {
    tenantId: string;
    branchId: string;
    userId: string;
}

export interface CollectionReport {
    totalCollected: number;
    totalPending: number;
    totalStudents: number;
    paidCount: number;
    partialCount: number;
    pendingCount: number;
    overdueCount: number;
}

export interface DefaulterInfo {
    studentId: string;
    studentName: string;
    rollNumber: string | null;
    className: string;
    sectionName: string;
    totalDue: number;
    overdueDays: number;
}
