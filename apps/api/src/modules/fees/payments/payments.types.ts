/**
 * Payments Types
 */
import type { PaymentResponse } from '../fees.types';

export interface PaymentListResponse {
    payments: PaymentResponse[];
    total: number;
}

export interface PaymentReceipt {
    receiptNumber: string;
    paymentDate: string;
    studentName: string;
    amount: number;
    paymentMode: string;
    feeType: string;
    balanceAfterPayment: number;
}
