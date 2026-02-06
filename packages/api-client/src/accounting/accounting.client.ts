/**
 * Accounting API Client
 * READ-ONLY exports
 */
import { apiClient } from '../core/axios';
import type { ApiResponse } from '../types/api-response';

export interface GSTSummary {
    month: string;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    creditNoteAdjustment: number;
    netGST: number;
}

export interface InvoiceRegisterItem {
    invoiceNumber: string;
    invoiceDate: string;
    customerGstin: string | null;
    placeOfSupply: string;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalAmount: number;
    status: string;
}

export interface RevenueSummary {
    month: string;
    grossRevenue: number;
    creditNotes: number;
    netRevenue: number;
    paidAmount: number;
    unpaidAmount: number;
}

export interface ReceivableItem {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: number;
    outstandingAmount: number;
    daysOverdue: number;
}

export interface DateRangeFilter {
    startDate?: string;
    endDate?: string;
}

const BASE_URL = '/accounting';

function buildUrl(path: string, filter?: DateRangeFilter, format?: string): string {
    const params = new URLSearchParams();
    if (filter?.startDate) params.set('startDate', filter.startDate);
    if (filter?.endDate) params.set('endDate', filter.endDate);
    if (format) params.set('format', format);
    const query = params.toString();
    return query ? `${BASE_URL}${path}?${query}` : `${BASE_URL}${path}`;
}

export const accountingClient = {
    /**
     * Get GST Summary
     */
    getGSTSummary: async (filter?: DateRangeFilter): Promise<GSTSummary[]> => {
        const response = await apiClient.get<ApiResponse<GSTSummary[]>>(
            buildUrl('/gst-summary', filter)
        );
        return response.data.data;
    },

    /**
     * Get Invoice Register
     */
    getInvoices: async (filter?: DateRangeFilter): Promise<InvoiceRegisterItem[]> => {
        const response = await apiClient.get<ApiResponse<InvoiceRegisterItem[]>>(
            buildUrl('/invoices', filter)
        );
        return response.data.data;
    },

    /**
     * Get Revenue Summary
     */
    getRevenue: async (filter?: DateRangeFilter): Promise<RevenueSummary[]> => {
        const response = await apiClient.get<ApiResponse<RevenueSummary[]>>(
            buildUrl('/revenue', filter)
        );
        return response.data.data;
    },

    /**
     * Get Receivables
     */
    getReceivables: async (): Promise<ReceivableItem[]> => {
        const response = await apiClient.get<ApiResponse<ReceivableItem[]>>(
            `${BASE_URL}/receivables`
        );
        return response.data.data;
    },

    /**
     * Get CSV download URL
     */
    getExportUrl: (report: 'gst-summary' | 'invoices' | 'credit-notes' | 'payments' | 'revenue', format: 'csv' | 'tally' = 'csv'): string => {
        return `${BASE_URL}/${report}?format=${format}`;
    },
};
