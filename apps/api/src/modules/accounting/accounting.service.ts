/**
 * Accounting Service
 * READ-ONLY aggregation and export
 * NO WRITE OPERATIONS
 */
import { AccountingRepository, accountingRepository } from './accounting.repository';
import { generateGSTSummary, gstSummaryToCSV } from './exports/gst-summary.export';
import { invoicesToTallyCSV, creditNotesToTallyCSV } from './exports/tally.export';
import { generateRevenueSummary, revenueSummaryToCSV } from './exports/revenue.export';
import type {
    DateRangeFilter,
    GSTSummary,
    InvoiceRegisterItem,
    CreditNoteRegisterItem,
    PaymentRegisterItem,
    RevenueSummary,
    ReceivableItem,
    AccountingContext,
    ExportFormat,
} from './accounting.types';
import { CSV_HEADERS } from './accounting.constants';

export class AccountingService {
    constructor(private readonly repository: AccountingRepository = accountingRepository) { }

    /**
     * Get GST Summary (READ-ONLY)
     */
    async getGSTSummary(
        context: AccountingContext,
        filter?: DateRangeFilter
    ): Promise<{ data: GSTSummary[]; csv: string }> {
        const invoices = await this.repository.getInvoices(context.tenantId, filter);
        const creditNotes = await this.repository.getCreditNotes(context.tenantId, filter);

        const data = generateGSTSummary(invoices, creditNotes);
        const csv = gstSummaryToCSV(data);

        return { data, csv };
    }

    /**
     * Get Invoice Register (READ-ONLY)
     */
    async getInvoiceRegister(
        context: AccountingContext,
        filter?: DateRangeFilter
    ): Promise<{ data: InvoiceRegisterItem[]; csv: string }> {
        const invoices = await this.repository.getInvoices(context.tenantId, filter);

        const data: InvoiceRegisterItem[] = invoices.map((inv) => {
            const cgst = inv.taxes.filter((t) => t.type === 'cgst').reduce((s, t) => s + t.amount, 0);
            const sgst = inv.taxes.filter((t) => t.type === 'sgst').reduce((s, t) => s + t.amount, 0);
            const igst = inv.taxes.filter((t) => t.type === 'igst').reduce((s, t) => s + t.amount, 0);

            return {
                invoiceNumber: inv.invoiceNumber,
                invoiceDate: inv.issuedAt?.toISOString().split('T')[0] || '',
                customerGstin: inv.gstin,
                placeOfSupply: inv.placeOfSupply,
                taxableAmount: inv.subtotalAmount,
                cgst,
                sgst,
                igst,
                totalAmount: inv.totalAmount,
                status: inv.status,
            };
        });

        const csv = this.invoicesToCSV(data);
        return { data, csv };
    }

    /**
     * Get Credit Note Register (READ-ONLY)
     */
    async getCreditNoteRegister(
        context: AccountingContext,
        filter?: DateRangeFilter
    ): Promise<{ data: CreditNoteRegisterItem[]; csv: string }> {
        const notes = await this.repository.getCreditNotes(context.tenantId, filter);

        const data: CreditNoteRegisterItem[] = notes.map((cn) => {
            const cgst = cn.taxes.filter((t) => t.taxType === 'cgst').reduce((s, t) => s + t.amount, 0);
            const sgst = cn.taxes.filter((t) => t.taxType === 'sgst').reduce((s, t) => s + t.amount, 0);
            const igst = cn.taxes.filter((t) => t.taxType === 'igst').reduce((s, t) => s + t.amount, 0);

            return {
                creditNoteNumber: cn.creditNumber,
                invoiceNumber: cn.invoice?.invoiceNumber || '',
                issueDate: cn.issuedAt.toISOString().split('T')[0],
                reason: cn.reason,
                taxableAmount: cn.subtotal,
                cgst,
                sgst,
                igst,
                totalCredit: cn.totalAmount,
            };
        });

        const csv = this.creditNotesToCSV(data);
        return { data, csv };
    }

    /**
     * Get Payment Register (READ-ONLY)
     */
    async getPaymentRegister(
        context: AccountingContext,
        filter?: DateRangeFilter
    ): Promise<{ data: PaymentRegisterItem[]; csv: string }> {
        const payments = await this.repository.getPayments(context.tenantId, filter);

        const data: PaymentRegisterItem[] = payments.map((p) => ({
            paymentId: p.providerPaymentId || p.id,
            invoiceNumber: null, // Would need to link through subscription
            amount: p.amount,
            provider: p.provider,
            date: p.createdAt.toISOString().split('T')[0],
            status: p.status,
        }));

        const csv = this.paymentsToCSV(data);
        return { data, csv };
    }

    /**
     * Get Revenue Summary (READ-ONLY)
     */
    async getRevenueSummary(
        context: AccountingContext,
        filter?: DateRangeFilter
    ): Promise<{ data: RevenueSummary[]; csv: string }> {
        const invoices = await this.repository.getInvoices(context.tenantId, filter);
        const creditNotes = await this.repository.getCreditNotes(context.tenantId, filter);

        const data = generateRevenueSummary(invoices, creditNotes);
        const csv = revenueSummaryToCSV(data);

        return { data, csv };
    }

    /**
     * Get Receivables (READ-ONLY)
     */
    async getReceivables(context: AccountingContext): Promise<{ data: ReceivableItem[]; csv: string }> {
        const invoices = await this.repository.getReceivables(context.tenantId);
        const now = new Date();

        const data: ReceivableItem[] = invoices.map((inv) => {
            const daysOverdue = Math.max(0, Math.floor((now.getTime() - inv.dueAt.getTime()) / (1000 * 60 * 60 * 24)));

            return {
                invoiceNumber: inv.invoiceNumber,
                invoiceDate: inv.issuedAt?.toISOString().split('T')[0] || '',
                dueDate: inv.dueAt.toISOString().split('T')[0],
                totalAmount: inv.totalAmount,
                paidAmount: 0, // Would need payment linking
                outstandingAmount: inv.totalAmount,
                daysOverdue,
            };
        });

        const csv = this.receivablesToCSV(data);
        return { data, csv };
    }

    /**
     * Get Tally export (READ-ONLY)
     */
    async getTallyExport(context: AccountingContext, filter?: DateRangeFilter): Promise<{ invoices: string; creditNotes: string }> {
        const { data: invoices } = await this.getInvoiceRegister(context, filter);
        const { data: creditNotes } = await this.getCreditNoteRegister(context, filter);

        return {
            invoices: invoicesToTallyCSV(invoices),
            creditNotes: creditNotesToTallyCSV(creditNotes),
        };
    }

    // CSV formatters
    private invoicesToCSV(data: InvoiceRegisterItem[]): string {
        const rows = [CSV_HEADERS.INVOICE.join(',')];
        for (const row of data) {
            rows.push([
                row.invoiceNumber,
                row.invoiceDate,
                row.customerGstin || '',
                row.placeOfSupply,
                (row.taxableAmount / 100).toFixed(2),
                (row.cgst / 100).toFixed(2),
                (row.sgst / 100).toFixed(2),
                (row.igst / 100).toFixed(2),
                (row.totalAmount / 100).toFixed(2),
                row.status,
            ].join(','));
        }
        return rows.join('\n');
    }

    private creditNotesToCSV(data: CreditNoteRegisterItem[]): string {
        const rows = [CSV_HEADERS.CREDIT_NOTE.join(',')];
        for (const row of data) {
            rows.push([
                row.creditNoteNumber,
                row.invoiceNumber,
                row.issueDate,
                row.reason,
                (row.taxableAmount / 100).toFixed(2),
                (row.cgst / 100).toFixed(2),
                (row.sgst / 100).toFixed(2),
                (row.igst / 100).toFixed(2),
                (row.totalCredit / 100).toFixed(2),
            ].join(','));
        }
        return rows.join('\n');
    }

    private paymentsToCSV(data: PaymentRegisterItem[]): string {
        const rows = [CSV_HEADERS.PAYMENT.join(',')];
        for (const row of data) {
            rows.push([
                row.paymentId,
                row.invoiceNumber || '',
                (row.amount / 100).toFixed(2),
                row.provider,
                row.date,
                row.status,
            ].join(','));
        }
        return rows.join('\n');
    }

    private receivablesToCSV(data: ReceivableItem[]): string {
        const rows = ['Invoice Number,Invoice Date,Due Date,Total Amount,Outstanding,Days Overdue'];
        for (const row of data) {
            rows.push([
                row.invoiceNumber,
                row.invoiceDate,
                row.dueDate,
                (row.totalAmount / 100).toFixed(2),
                (row.outstandingAmount / 100).toFixed(2),
                row.daysOverdue.toString(),
            ].join(','));
        }
        return rows.join('\n');
    }
}

export const accountingService = new AccountingService();
