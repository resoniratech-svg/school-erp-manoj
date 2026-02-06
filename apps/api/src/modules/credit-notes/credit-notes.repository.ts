/**
 * Credit Notes Repository
 * Append-only credit note storage
 * NO UPDATE, NO DELETE
 */
import { prisma } from '@school-erp/database';
import type { CreditNote, CreditNoteItem, CreditNoteTax, CreditNoteStatus, CreditReason, TaxType, InvoiceItemType } from '@prisma/client';

export class CreditNotesRepository {
    /**
     * Create credit note with items and taxes
     */
    async create(data: {
        invoiceId: string;
        tenantId: string;
        creditNumber: string;
        reason: CreditReason;
        status: CreditNoteStatus;
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        notes?: string;
        items: Array<{
            description: string;
            quantity: number;
            unitPrice: number;
            amount: number;
            itemType: InvoiceItemType;
        }>;
        taxes: Array<{
            taxType: TaxType;
            rate: number;
            amount: number;
        }>;
    }): Promise<CreditNote & { items: CreditNoteItem[]; taxes: CreditNoteTax[] }> {
        return prisma.creditNote.create({
            data: {
                invoiceId: data.invoiceId,
                tenantId: data.tenantId,
                creditNumber: data.creditNumber,
                reason: data.reason,
                status: data.status,
                subtotal: data.subtotal,
                taxAmount: data.taxAmount,
                totalAmount: data.totalAmount,
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
     * Get credit note by ID
     */
    async getById(id: string): Promise<(CreditNote & { items: CreditNoteItem[]; taxes: CreditNoteTax[] }) | null> {
        return prisma.creditNote.findUnique({
            where: { id },
            include: {
                items: true,
                taxes: true,
            },
        });
    }

    /**
     * Get credit notes by tenant
     */
    async getByTenantId(
        tenantId: string,
        options?: { limit?: number; offset?: number }
    ): Promise<Array<CreditNote & { items: CreditNoteItem[]; taxes: CreditNoteTax[] }>> {
        return prisma.creditNote.findMany({
            where: { tenantId },
            include: {
                items: true,
                taxes: true,
            },
            orderBy: { issuedAt: 'desc' },
            take: options?.limit ?? 50,
            skip: options?.offset ?? 0,
        });
    }

    /**
     * Get credit notes for an invoice
     */
    async getByInvoiceId(invoiceId: string): Promise<CreditNote[]> {
        return prisma.creditNote.findMany({
            where: { invoiceId },
            orderBy: { issuedAt: 'desc' },
        });
    }

    /**
     * Get total credited amount for an invoice
     */
    async getTotalCreditedForInvoice(invoiceId: string): Promise<number> {
        const result = await prisma.creditNote.aggregate({
            where: { invoiceId },
            _sum: { totalAmount: true },
        });
        return result._sum.totalAmount ?? 0;
    }

    /**
     * Get next sequence number
     */
    async getNextSequence(fiscalYear: string): Promise<number> {
        const prefix = `CN-${fiscalYear}-`;
        const lastNote = await prisma.creditNote.findFirst({
            where: {
                creditNumber: { startsWith: prefix },
            },
            orderBy: { creditNumber: 'desc' },
        });

        if (!lastNote) {
            return 1;
        }

        const lastNumber = lastNote.creditNumber.split('-').pop();
        return parseInt(lastNumber || '0', 10) + 1;
    }

    /**
     * Update status to applied
     */
    async markApplied(id: string): Promise<CreditNote> {
        return prisma.creditNote.update({
            where: { id },
            data: {
                status: 'applied',
                appliedAt: new Date(),
            },
        });
    }

    // NO DELETE - Credit notes are immutable
}

export const creditNotesRepository = new CreditNotesRepository();
