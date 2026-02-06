/**
 * Credit Notes Types
 */

export interface CreateCreditNoteInput {
    invoiceId: string;
    reason: 'overbilling' | 'plan_downgrade' | 'refund' | 'gst_correction' | 'cancellation';
    amount: number; // paise - amount to credit
    notes?: string;
}

export interface CreditNoteItemInput {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    itemType: 'subscription' | 'overage' | 'adjustment';
}

export interface CreditNoteTaxInput {
    taxType: 'cgst' | 'sgst' | 'igst';
    rate: number;
    amount: number;
}

export interface CreditNoteResponse {
    id: string;
    invoiceId: string;
    creditNumber: string;
    reason: string;
    status: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    notes: string | null;
    issuedAt: string;
    appliedAt: string | null;
    items: CreditNoteItemResponse[];
    taxes: CreditNoteTaxResponse[];
}

export interface CreditNoteItemResponse {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    itemType: string;
}

export interface CreditNoteTaxResponse {
    id: string;
    taxType: string;
    rate: number;
    amount: number;
}

export interface CreditNoteContext {
    tenantId: string;
    userId: string;
}
