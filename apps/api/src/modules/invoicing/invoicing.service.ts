/**
 * Invoicing Service
 * Core invoice generation logic
 */
import { InvoicingRepository, invoicingRepository } from './invoicing.repository';
import { subscriptionService } from '../subscription/subscription.service';
import { calculateGST, getTotalTax } from './invoicing.tax';
import { generateInvoiceNumber } from './invoicing.numbering';
import {
    INVOICE_STATUS,
    INVOICE_ITEM_TYPE,
    INVOICE_DUE_DAYS,
    INVOICE_ERROR_CODES,
} from './invoicing.constants';
import type {
    GenerateInvoiceInput,
    InvoiceResponse,
    InvoiceContext,
} from './invoicing.types';
import { NotFoundError, ConflictError } from '@school-erp/shared';
import type { Invoice, InvoiceItem, InvoiceTax, InvoiceStatus, InvoiceItemType, TaxType } from '@prisma/client';
import { getLogger } from '../../utils/logger';

const logger = getLogger('invoicing-service');

export class InvoicingService {
    constructor(private readonly repository: InvoicingRepository = invoicingRepository) { }

    /**
     * Generate invoice for tenant's billing period
     */
    async generateInvoice(
        input: GenerateInvoiceInput,
        context: InvoiceContext
    ): Promise<InvoiceResponse> {
        // 1. Get subscription
        const subscription = await subscriptionService.getCurrentSubscription(input.tenantId);
        if (!subscription) {
            throw new NotFoundError(INVOICE_ERROR_CODES.NO_SUBSCRIPTION);
        }

        // 2. Determine billing period
        const now = new Date();
        const billingPeriodStart = input.billingPeriodStart || this.getMonthStart(now);
        const billingPeriodEnd = input.billingPeriodEnd || this.getMonthEnd(now);

        // 3. Check for duplicate
        const exists = await this.repository.existsForPeriod(
            input.tenantId,
            billingPeriodStart,
            billingPeriodEnd
        );
        if (exists) {
            throw new ConflictError(INVOICE_ERROR_CODES.ALREADY_EXISTS);
        }

        // 4. Build invoice items
        const items: Array<{
            type: InvoiceItemType;
            description: string;
            quantity: number;
            unitPrice: number;
            amount: number;
        }> = [];

        // Add subscription fee
        const planPrice = subscription.plan.priceMonthly;
        if (planPrice > 0) {
            items.push({
                type: 'subscription' as InvoiceItemType,
                description: `${subscription.plan.name} Plan - Monthly Subscription`,
                quantity: 1,
                unitPrice: planPrice,
                amount: planPrice,
            });
        }

        // Calculate subtotal
        const subtotalAmount = items.reduce((sum, item) => sum + item.amount, 0);

        // 5. Calculate GST
        const taxBreakdowns = calculateGST(subtotalAmount, input.placeOfSupply);
        const taxAmount = getTotalTax(taxBreakdowns);
        const totalAmount = subtotalAmount + taxAmount;

        // 6. Generate invoice number
        const invoiceNumber = await generateInvoiceNumber();

        // 7. Calculate due date
        const dueAt = new Date(now);
        dueAt.setDate(dueAt.getDate() + INVOICE_DUE_DAYS);

        // 8. Create invoice
        const taxes: Array<{ type: TaxType; rate: number; amount: number }> = taxBreakdowns.map((t) => ({
            type: t.type as TaxType,
            rate: t.rate,
            amount: t.amount,
        }));

        const invoice = await this.repository.create({
            tenantId: input.tenantId,
            invoiceNumber,
            status: 'issued' as InvoiceStatus,
            currency: 'INR',
            subtotalAmount,
            taxAmount,
            totalAmount,
            issuedAt: now,
            dueAt,
            billingPeriodStart,
            billingPeriodEnd,
            gstin: input.gstin,
            placeOfSupply: input.placeOfSupply,
            items,
            taxes,
        });

        logger.info(
            `Invoice generated: ${invoiceNumber}, tenant=${input.tenantId}, total=${totalAmount}`
        );

        return this.mapToResponse(invoice);
    }

    /**
     * Get invoice by ID
     */
    async getInvoice(id: string, tenantId: string): Promise<InvoiceResponse> {
        const invoice = await this.repository.getById(id);
        if (!invoice || invoice.tenantId !== tenantId) {
            throw new NotFoundError(INVOICE_ERROR_CODES.NOT_FOUND);
        }
        return this.mapToResponse(invoice);
    }

    /**
     * List invoices for tenant
     */
    async listInvoices(
        tenantId: string,
        options?: { limit?: number; offset?: number }
    ): Promise<InvoiceResponse[]> {
        const invoices = await this.repository.getByTenantId(tenantId, options);
        return invoices.map(this.mapToResponse);
    }

    /**
     * Map invoice to response
     */
    private mapToResponse(
        invoice: Invoice & { items: InvoiceItem[]; taxes: InvoiceTax[] }
    ): InvoiceResponse {
        return {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            currency: invoice.currency,
            subtotalAmount: invoice.subtotalAmount,
            taxAmount: invoice.taxAmount,
            totalAmount: invoice.totalAmount,
            issuedAt: invoice.issuedAt?.toISOString() || null,
            dueAt: invoice.dueAt.toISOString(),
            billingPeriodStart: invoice.billingPeriodStart.toISOString(),
            billingPeriodEnd: invoice.billingPeriodEnd.toISOString(),
            gstin: invoice.gstin,
            placeOfSupply: invoice.placeOfSupply,
            createdAt: invoice.createdAt.toISOString(),
            items: invoice.items.map((item) => ({
                id: item.id,
                type: item.type,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.amount,
            })),
            taxes: invoice.taxes.map((tax) => ({
                id: tax.id,
                type: tax.type,
                rate: tax.rate,
                amount: tax.amount,
            })),
        };
    }

    private getMonthStart(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    private getMonthEnd(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    }
}

export const invoicingService = new InvoicingService();
