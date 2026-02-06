/**
 * Invoice Repository
 * Append-only invoice storage
 * NO UPDATE, NO DELETE
 */
import { prisma } from '@school-erp/database';
import type { Invoice, InvoiceItem, InvoiceTax, InvoiceStatus, TaxType, InvoiceItemType } from '@prisma/client';

export class InvoicingRepository {
    /**
     * Create invoice with items and taxes
     */
    async create(data: {
        tenantId: string;
        invoiceNumber: string;
        status: InvoiceStatus;
        currency: string;
        subtotalAmount: number;
        taxAmount: number;
        totalAmount: number;
        issuedAt?: Date;
        dueAt: Date;
        billingPeriodStart: Date;
        billingPeriodEnd: Date;
        gstin?: string;
        placeOfSupply: string;
        notes?: string;
        items: Array<{
            type: InvoiceItemType;
            description: string;
            quantity: number;
            unitPrice: number;
            amount: number;
        }>;
        taxes: Array<{
            type: TaxType;
            rate: number;
            amount: number;
        }>;
    }): Promise<Invoice> {
        return prisma.invoice.create({
            data: {
                tenantId: data.tenantId,
                invoiceNumber: data.invoiceNumber,
                status: data.status,
                currency: data.currency,
                subtotalAmount: data.subtotalAmount,
                taxAmount: data.taxAmount,
                totalAmount: data.totalAmount,
                issuedAt: data.issuedAt,
                dueAt: data.dueAt,
                billingPeriodStart: data.billingPeriodStart,
                billingPeriodEnd: data.billingPeriodEnd,
                gstin: data.gstin,
                placeOfSupply: data.placeOfSupply,
                notes: data.notes,
                items: {
                    create: data.items,
                },
                taxes: {
                    create: data.taxes,
                },
            },
            include: {
                items: true,
                taxes: true,
            },
        });
    }

    /**
     * Get invoice by ID
     */
    async getById(id: string): Promise<(Invoice & { items: InvoiceItem[]; taxes: InvoiceTax[] }) | null> {
        return prisma.invoice.findUnique({
            where: { id },
            include: {
                items: true,
                taxes: true,
            },
        });
    }

    /**
     * Get invoice by number
     */
    async getByNumber(invoiceNumber: string): Promise<Invoice | null> {
        return prisma.invoice.findUnique({
            where: { invoiceNumber },
        });
    }

    /**
     * Get invoices by tenant
     */
    async getByTenantId(
        tenantId: string,
        options?: { limit?: number; offset?: number }
    ): Promise<Array<Invoice & { items: InvoiceItem[]; taxes: InvoiceTax[] }>> {
        return prisma.invoice.findMany({
            where: { tenantId },
            include: {
                items: true,
                taxes: true,
            },
            orderBy: { createdAt: 'desc' },
            take: options?.limit ?? 50,
            skip: options?.offset ?? 0,
        });
    }

    /**
     * Update invoice status only (for payment sync)
     */
    async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
        return prisma.invoice.update({
            where: { id },
            data: { status },
        });
    }

    /**
     * Get next sequence number for fiscal year
     */
    async getNextSequence(fiscalYear: string): Promise<number> {
        const prefix = `INV-${fiscalYear}-`;
        const lastInvoice = await prisma.invoice.findFirst({
            where: {
                invoiceNumber: { startsWith: prefix },
            },
            orderBy: { invoiceNumber: 'desc' },
        });

        if (!lastInvoice) {
            return 1;
        }

        const lastNumber = lastInvoice.invoiceNumber.split('-').pop();
        return parseInt(lastNumber || '0', 10) + 1;
    }

    /**
     * Check if invoice exists for period
     */
    async existsForPeriod(
        tenantId: string,
        billingPeriodStart: Date,
        billingPeriodEnd: Date
    ): Promise<boolean> {
        const count = await prisma.invoice.count({
            where: {
                tenantId,
                billingPeriodStart,
                billingPeriodEnd,
            },
        });
        return count > 0;
    }

    // NO DELETE - Invoices are immutable
}

export const invoicingRepository = new InvoicingRepository();
