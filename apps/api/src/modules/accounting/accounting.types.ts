/**
 * Accounting Types
 * DTOs for reports - READ-ONLY
 */

export interface DateRangeFilter {
    startDate: Date;
    endDate: Date;
}

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

export interface CreditNoteRegisterItem {
    creditNoteNumber: string;
    invoiceNumber: string;
    issueDate: string;
    reason: string;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalCredit: number;
}

export interface PaymentRegisterItem {
    paymentId: string;
    invoiceNumber: string | null;
    amount: number;
    provider: string;
    date: string;
    status: string;
}

export interface RevenueSummary {
    month: string;
    grossRevenue: number;
    creditNotes: number;
    netRevenue: number;
    paidAmount: number;
    unpaidAmount: number;
    planBreakdown: Record<string, number>;
}

export interface ReceivableItem {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    daysOverdue: number;
}

export interface AccountingContext {
    tenantId: string;
    userId: string;
}

export type ExportFormat = 'json' | 'csv' | 'tally' | 'zoho';
