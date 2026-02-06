/**
 * Credit Notes API Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse } from '../types/api-response';

export interface CreditNoteItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    itemType: string;
}

export interface CreditNoteTax {
    id: string;
    taxType: string;
    rate: number;
    amount: number;
}

export interface CreditNote {
    id: string;
    invoiceId: string;
    creditNumber: string;
    reason: 'overbilling' | 'plan_downgrade' | 'refund' | 'gst_correction' | 'cancellation';
    status: 'issued' | 'applied';
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    notes: string | null;
    issuedAt: string;
    appliedAt: string | null;
    items: CreditNoteItem[];
    taxes: CreditNoteTax[];
}

export interface CreateCreditNoteInput {
    invoiceId: string;
    reason: 'overbilling' | 'plan_downgrade' | 'refund' | 'gst_correction' | 'cancellation';
    amount: number;
    notes?: string;
}

const BASE_URL = '/credit-notes';

export const creditNoteClient = {
    /**
     * List credit notes
     */
    list: async (options?: { limit?: number; offset?: number }): Promise<CreditNote[]> => {
        const params = new URLSearchParams();
        if (options?.limit) params.set('limit', String(options.limit));
        if (options?.offset) params.set('offset', String(options.offset));

        const response = await apiClient.get<ApiResponse<CreditNote[]>>(
            `${BASE_URL}?${params.toString()}`
        );
        return response.data.data;
    },

    /**
     * Get credit note by ID
     */
    get: async (id: string): Promise<CreditNote> => {
        const response = await apiClient.get<ApiResponse<CreditNote>>(`${BASE_URL}/${id}`);
        return response.data.data;
    },

    /**
     * Create credit note
     */
    create: async (input: CreateCreditNoteInput): Promise<CreditNote> => {
        const response = await apiClient.post<ApiResponse<CreditNote>>(
            `${BASE_URL}/create`,
            input
        );
        return response.data.data;
    },

    /**
     * Get PDF URL
     */
    getPdfUrl: (id: string): string => {
        return `${BASE_URL}/${id}/pdf`;
    },
};
