/**
 * Invoice API Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse } from '../types/api-response';

// Types
export interface InvoiceItem {
    id: string;
    type: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface InvoiceTax {
    id: string;
    type: string;
    rate: number;
    amount: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
    currency: string;
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
    issuedAt: string | null;
    dueAt: string;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    gstin: string | null;
    placeOfSupply: string;
    createdAt: string;
    items: InvoiceItem[];
    taxes: InvoiceTax[];
}

export interface GenerateInvoiceInput {
    placeOfSupply: string;
    gstin?: string;
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
}

const BASE_URL = '/invoices';

export const invoiceClient = {
    /**
     * List invoices
     */
    list: async (options?: { limit?: number; offset?: number }): Promise<Invoice[]> => {
        const params = new URLSearchParams();
        if (options?.limit) params.set('limit', String(options.limit));
        if (options?.offset) params.set('offset', String(options.offset));

        const response = await apiClient.get<ApiResponse<Invoice[]>>(
            `${BASE_URL}?${params.toString()}`
        );
        return response.data.data;
    },

    /**
     * Get invoice by ID
     */
    get: async (id: string): Promise<Invoice> => {
        const response = await apiClient.get<ApiResponse<Invoice>>(`${BASE_URL}/${id}`);
        return response.data.data;
    },

    /**
     * Generate invoice
     */
    generate: async (input: GenerateInvoiceInput): Promise<Invoice> => {
        const response = await apiClient.post<ApiResponse<Invoice>>(
            `${BASE_URL}/generate`,
            input
        );
        return response.data.data;
    },

    /**
     * Get PDF download URL
     */
    getPdfUrl: (id: string): string => {
        return `${BASE_URL}/${id}/pdf`;
    },
};
