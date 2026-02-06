/**
 * Credit Notes Service Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CREDIT_NOTE_ERROR_CODES } from '../credit-notes.constants';

// Mock repository
const mockRepository = {
    create: vi.fn(),
    getById: vi.fn(),
    getByTenantId: vi.fn(),
    getTotalCreditedForInvoice: vi.fn(),
    getNextSequence: vi.fn(),
};

// Mock invoicing repository
vi.mock('../../invoicing/invoicing.repository', () => ({
    invoicingRepository: {
        getById: vi.fn(),
    },
}));

import { invoicingRepository } from '../../invoicing/invoicing.repository';

describe('CreditNotesService', () => {
    const tenantId = 'tenant-123';
    const context = { tenantId, userId: 'user-123' };

    const mockInvoice = {
        id: 'invoice-123',
        tenantId,
        invoiceNumber: 'INV-2025-000001',
        status: 'issued',
        totalAmount: 100000,
        subtotalAmount: 84746,
        taxAmount: 15254,
        items: [
            { id: 'item-1', description: 'Basic Plan', type: 'subscription', amount: 84746 },
        ],
        taxes: [
            { id: 'tax-1', type: 'cgst', rate: 9, amount: 7627 },
            { id: 'tax-2', type: 'sgst', rate: 9, amount: 7627 },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createCreditNote', () => {
        it('should reject over-credit', async () => {
            (invoicingRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(mockInvoice);
            mockRepository.getTotalCreditedForInvoice.mockResolvedValue(50000);

            // Attempt to credit more than remaining
            const { CreditNotesService } = await import('../credit-notes.service');
            const service = new CreditNotesService(mockRepository as never);

            await expect(
                service.createCreditNote(
                    {
                        invoiceId: 'invoice-123',
                        reason: 'overbilling',
                        amount: 60000, // Only 50000 remaining
                    },
                    context
                )
            ).rejects.toThrow(CREDIT_NOTE_ERROR_CODES.OVER_CREDIT);
        });

        it('should reject invalid invoice status', async () => {
            (invoicingRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue({
                ...mockInvoice,
                status: 'draft',
            });

            const { CreditNotesService } = await import('../credit-notes.service');
            const service = new CreditNotesService(mockRepository as never);

            await expect(
                service.createCreditNote(
                    {
                        invoiceId: 'invoice-123',
                        reason: 'refund',
                        amount: 10000,
                    },
                    context
                )
            ).rejects.toThrow(CREDIT_NOTE_ERROR_CODES.INVALID_INVOICE_STATUS);
        });

        it('should block cross-tenant access', async () => {
            (invoicingRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue({
                ...mockInvoice,
                tenantId: 'other-tenant',
            });

            const { CreditNotesService } = await import('../credit-notes.service');
            const service = new CreditNotesService(mockRepository as never);

            await expect(
                service.createCreditNote(
                    {
                        invoiceId: 'invoice-123',
                        reason: 'refund',
                        amount: 10000,
                    },
                    context
                )
            ).rejects.toThrow(CREDIT_NOTE_ERROR_CODES.INVOICE_NOT_FOUND);
        });
    });
});
