/**
 * Invoicing Types
 */

export interface InvoiceItemInput {
    type: 'subscription' | 'overage' | 'adjustment';
    description: string;
    quantity: number;
    unitPrice: number; // paise
}

export interface TaxBreakdown {
    type: 'cgst' | 'sgst' | 'igst';
    rate: number;
    amount: number;
}

export interface GenerateInvoiceInput {
    tenantId: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    gstin?: string;
    placeOfSupply: string;
}

export interface InvoiceResponse {
    id: string;
    invoiceNumber: string;
    status: string;
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
    items: InvoiceItemResponse[];
    taxes: TaxResponse[];
}

export interface InvoiceItemResponse {
    id: string;
    type: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface TaxResponse {
    id: string;
    type: string;
    rate: number;
    amount: number;
}

export interface InvoiceContext {
    tenantId: string;
    userId: string;
}
