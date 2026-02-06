/**
 * Accounting Service Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateGSTSummary } from '../exports/gst-summary.export';
import { generateRevenueSummary } from '../exports/revenue.export';

describe('Accounting Exports', () => {
    describe('GST Summary', () => {
        it('should aggregate GST by month', () => {
            const invoices = [
                {
                    issuedAt: new Date('2025-01-15'),
                    subtotalAmount: 100000,
                    taxes: [
                        { type: 'cgst', amount: 9000 },
                        { type: 'sgst', amount: 9000 },
                    ],
                },
                {
                    issuedAt: new Date('2025-01-20'),
                    subtotalAmount: 50000,
                    taxes: [
                        { type: 'igst', amount: 9000 },
                    ],
                },
            ];

            const result = generateGSTSummary(invoices, []);

            expect(result).toHaveLength(1);
            expect(result[0].month).toBe('2025-01');
            expect(result[0].taxableValue).toBe(150000);
            expect(result[0].cgst).toBe(9000);
            expect(result[0].sgst).toBe(9000);
            expect(result[0].igst).toBe(9000);
        });

        it('should subtract credit notes from GST', () => {
            const invoices = [
                {
                    issuedAt: new Date('2025-01-15'),
                    subtotalAmount: 100000,
                    taxes: [
                        { type: 'cgst', amount: 9000 },
                        { type: 'sgst', amount: 9000 },
                    ],
                },
            ];

            const creditNotes = [
                {
                    issuedAt: new Date('2025-01-20'),
                    subtotal: 20000,
                    taxes: [
                        { taxType: 'cgst', amount: 1800 },
                        { taxType: 'sgst', amount: 1800 },
                    ],
                },
            ];

            const result = generateGSTSummary(invoices, creditNotes);

            expect(result[0].cgst).toBe(7200); // 9000 - 1800
            expect(result[0].sgst).toBe(7200);
            expect(result[0].creditNoteAdjustment).toBe(20000);
        });
    });

    describe('Revenue Summary', () => {
        it('should calculate net revenue', () => {
            const invoices = [
                { issuedAt: new Date('2025-01-15'), status: 'paid', totalAmount: 100000 },
                { issuedAt: new Date('2025-01-20'), status: 'issued', totalAmount: 50000 },
            ];

            const creditNotes = [
                { issuedAt: new Date('2025-01-25'), totalAmount: 10000 },
            ];

            const result = generateRevenueSummary(invoices, creditNotes);

            expect(result[0].grossRevenue).toBe(150000);
            expect(result[0].creditNotes).toBe(10000);
            expect(result[0].netRevenue).toBe(140000);
            expect(result[0].paidAmount).toBe(100000);
            expect(result[0].unpaidAmount).toBe(50000);
        });
    });
});
