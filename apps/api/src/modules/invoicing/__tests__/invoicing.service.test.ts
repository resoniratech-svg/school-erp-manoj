/**
 * Invoicing Service Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateGST, getTotalTax } from '../invoicing.tax';
import { getFiscalYear } from '../invoicing.numbering';
import { TAX_TYPE, GST_RATES, COMPANY_INFO } from '../invoicing.constants';

describe('GST Tax Calculation', () => {
    describe('calculateGST', () => {
        it('should apply CGST + SGST for same state (Karnataka)', () => {
            const subtotal = 100000; // ₹1000 in paise
            const taxes = calculateGST(subtotal, 'Karnataka');

            expect(taxes).toHaveLength(2);
            expect(taxes[0].type).toBe(TAX_TYPE.CGST);
            expect(taxes[0].rate).toBe(GST_RATES.CGST);
            expect(taxes[0].amount).toBe(9000); // 9%

            expect(taxes[1].type).toBe(TAX_TYPE.SGST);
            expect(taxes[1].rate).toBe(GST_RATES.SGST);
            expect(taxes[1].amount).toBe(9000); // 9%
        });

        it('should apply IGST for different state (Maharashtra)', () => {
            const subtotal = 100000; // ₹1000 in paise
            const taxes = calculateGST(subtotal, 'Maharashtra');

            expect(taxes).toHaveLength(1);
            expect(taxes[0].type).toBe(TAX_TYPE.IGST);
            expect(taxes[0].rate).toBe(GST_RATES.IGST);
            expect(taxes[0].amount).toBe(18000); // 18%
        });

        it('should handle case-insensitive state matching', () => {
            const subtotal = 100000;
            const taxes1 = calculateGST(subtotal, 'KARNATAKA');
            const taxes2 = calculateGST(subtotal, 'karnataka');

            expect(taxes1).toHaveLength(2); // CGST + SGST
            expect(taxes2).toHaveLength(2);
        });
    });

    describe('getTotalTax', () => {
        it('should sum all tax amounts', () => {
            const taxes = [
                { type: TAX_TYPE.CGST, rate: 9, amount: 9000 },
                { type: TAX_TYPE.SGST, rate: 9, amount: 9000 },
            ];

            expect(getTotalTax(taxes)).toBe(18000);
        });

        it('should return 0 for empty array', () => {
            expect(getTotalTax([])).toBe(0);
        });
    });
});

describe('Invoice Numbering', () => {
    describe('getFiscalYear', () => {
        it('should return current year for April onwards', () => {
            const april = new Date(2025, 3, 15); // April 2025
            expect(getFiscalYear(april)).toBe('2025');
        });

        it('should return previous year for January-March', () => {
            const january = new Date(2025, 0, 15); // January 2025
            expect(getFiscalYear(january)).toBe('2024');
        });

        it('should handle March correctly', () => {
            const march = new Date(2025, 2, 31); // March 2025
            expect(getFiscalYear(march)).toBe('2024');
        });
    });
});
