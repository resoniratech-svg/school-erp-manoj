/**
 * Credit Notes Service
 * GST-compliant credit note generation
 */
import { CreditNotesRepository, creditNotesRepository } from './credit-notes.repository';
import { invoicingRepository } from '../invoicing/invoicing.repository';
import { generateCreditNoteNumber } from './credit-notes.numbering';
import { CREDIT_NOTE_STATUS, CREDIT_NOTE_ERROR_CODES } from './credit-notes.constants';
import type { CreateCreditNoteInput, CreditNoteResponse, CreditNoteContext } from './credit-notes.types';
import { NotFoundError, ConflictError, BadRequestError } from '@school-erp/shared';
import type { CreditNote, CreditNoteItem, CreditNoteTax, CreditReason, CreditNoteStatus, TaxType, InvoiceItemType } from '@prisma/client';
import { getLogger } from '../../utils/logger';

const logger = getLogger('credit-notes-service');

export class CreditNotesService {
    constructor(private readonly repository: CreditNotesRepository = creditNotesRepository) { }

    /**
     * Create credit note for an invoice
     */
    async createCreditNote(
        input: CreateCreditNoteInput,
        context: CreditNoteContext
    ): Promise<CreditNoteResponse> {
        // 1. Get invoice
        const invoice = await invoicingRepository.getById(input.invoiceId);
        if (!invoice) {
            throw new NotFoundError(CREDIT_NOTE_ERROR_CODES.INVOICE_NOT_FOUND);
        }

        // 2. Verify tenant ownership
        if (invoice.tenantId !== context.tenantId) {
            throw new NotFoundError(CREDIT_NOTE_ERROR_CODES.INVOICE_NOT_FOUND);
        }

        // 3. Verify invoice status
        if (!['issued', 'paid', 'partially_paid'].includes(invoice.status)) {
            throw new BadRequestError(CREDIT_NOTE_ERROR_CODES.INVALID_INVOICE_STATUS);
        }

        // 4. Check for over-credit
        const existingCredits = await this.repository.getTotalCreditedForInvoice(input.invoiceId);
        const remainingAmount = invoice.totalAmount - existingCredits;

        if (input.amount > remainingAmount) {
            throw new ConflictError(CREDIT_NOTE_ERROR_CODES.OVER_CREDIT);
        }

        // 5. Calculate pro-rata tax reversal
        const creditRatio = input.amount / invoice.totalAmount;
        const subtotal = Math.round(invoice.subtotalAmount * creditRatio);
        const taxAmount = input.amount - subtotal;

        // 6. Build items (pro-rata from invoice)
        const items: Array<{
            description: string;
            quantity: number;
            unitPrice: number;
            amount: number;
            itemType: InvoiceItemType;
        }> = invoice.items.map((item) => ({
            description: `Credit: ${item.description}`,
            quantity: 1,
            unitPrice: Math.round(item.amount * creditRatio),
            amount: Math.round(item.amount * creditRatio),
            itemType: item.type,
        }));

        // 7. Build taxes (pro-rata)
        const taxes: Array<{ taxType: TaxType; rate: number; amount: number }> = invoice.taxes.map((tax) => ({
            taxType: tax.type,
            rate: tax.rate,
            amount: Math.round(tax.amount * creditRatio),
        }));

        // 8. Generate credit note number
        const creditNumber = await generateCreditNoteNumber();

        // 9. Create credit note
        const creditNote = await this.repository.create({
            invoiceId: input.invoiceId,
            tenantId: context.tenantId,
            creditNumber,
            reason: input.reason as CreditReason,
            status: 'issued' as CreditNoteStatus,
            subtotal,
            taxAmount,
            totalAmount: input.amount,
            notes: input.notes,
            items,
            taxes,
        });

        logger.info(`Credit note created: ${creditNumber}, invoice=${input.invoiceId}, amount=${input.amount}`);

        return this.mapToResponse(creditNote);
    }

    /**
     * Get credit note by ID
     */
    async getCreditNote(id: string, tenantId: string): Promise<CreditNoteResponse> {
        const creditNote = await this.repository.getById(id);
        if (!creditNote || creditNote.tenantId !== tenantId) {
            throw new NotFoundError(CREDIT_NOTE_ERROR_CODES.NOT_FOUND);
        }
        return this.mapToResponse(creditNote);
    }

    /**
     * List credit notes for tenant
     */
    async listCreditNotes(
        tenantId: string,
        options?: { limit?: number; offset?: number }
    ): Promise<CreditNoteResponse[]> {
        const notes = await this.repository.getByTenantId(tenantId, options);
        return notes.map(this.mapToResponse);
    }

    /**
     * Map to response
     */
    private mapToResponse(
        creditNote: CreditNote & { items: CreditNoteItem[]; taxes: CreditNoteTax[] }
    ): CreditNoteResponse {
        return {
            id: creditNote.id,
            invoiceId: creditNote.invoiceId,
            creditNumber: creditNote.creditNumber,
            reason: creditNote.reason,
            status: creditNote.status,
            subtotal: creditNote.subtotal,
            taxAmount: creditNote.taxAmount,
            totalAmount: creditNote.totalAmount,
            notes: creditNote.notes,
            issuedAt: creditNote.issuedAt.toISOString(),
            appliedAt: creditNote.appliedAt?.toISOString() || null,
            items: creditNote.items.map((item) => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.amount,
                itemType: item.itemType,
            })),
            taxes: creditNote.taxes.map((tax) => ({
                id: tax.id,
                taxType: tax.taxType,
                rate: tax.rate,
                amount: tax.amount,
            })),
        };
    }
}

export const creditNotesService = new CreditNotesService();
