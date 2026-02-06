/**
 * Payments Service
 * CRITICAL: Append-only - NO DELETE OPERATIONS
 */
import { feesService } from '../fees.service';
import type { PaymentResponse, FeesContext } from '../fees.types';
import type { RecordPaymentInput } from '../fees.validator';

export class PaymentsService {
    /**
     * Record payment - append-only
     */
    async record(input: RecordPaymentInput, context: FeesContext): Promise<PaymentResponse> {
        return feesService.recordPayment(input, context);
    }

    async getById(id: string): Promise<PaymentResponse> {
        return feesService.getPayment(id);
    }

    async list(
        filters: { feeAssignmentId?: string; studentId?: string; fromDate?: string; toDate?: string },
        context: FeesContext
    ): Promise<PaymentResponse[]> {
        return feesService.listPayments(filters, context);
    }

    // NO DELETE METHOD - Payments are append-only
}

export const paymentsService = new PaymentsService();
