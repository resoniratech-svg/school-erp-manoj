/**
 * GST Tax Calculation
 * India-compliant CGST/SGST/IGST logic
 */
import { GST_RATES, COMPANY_INFO, TAX_TYPE } from './invoicing.constants';
import type { TaxBreakdown } from './invoicing.types';

/**
 * Calculate GST based on place of supply
 * 
 * Rules:
 * - Same state as company → CGST + SGST (split 50/50)
 * - Different state → IGST (full rate)
 */
export function calculateGST(
    subtotal: number, // in paise
    placeOfSupply: string
): TaxBreakdown[] {
    const companyState = COMPANY_INFO.STATE_NAME.toLowerCase();
    const supplyState = placeOfSupply.toLowerCase();

    const isSameState = supplyState === companyState ||
        supplyState.includes(companyState) ||
        companyState.includes(supplyState);

    if (isSameState) {
        // Intra-state: CGST + SGST
        const cgstAmount = Math.round((subtotal * GST_RATES.CGST) / 100);
        const sgstAmount = Math.round((subtotal * GST_RATES.SGST) / 100);

        return [
            { type: TAX_TYPE.CGST, rate: GST_RATES.CGST, amount: cgstAmount },
            { type: TAX_TYPE.SGST, rate: GST_RATES.SGST, amount: sgstAmount },
        ];
    } else {
        // Inter-state: IGST
        const igstAmount = Math.round((subtotal * GST_RATES.IGST) / 100);

        return [
            { type: TAX_TYPE.IGST, rate: GST_RATES.IGST, amount: igstAmount },
        ];
    }
}

/**
 * Get total tax amount from breakdowns
 */
export function getTotalTax(taxes: TaxBreakdown[]): number {
    return taxes.reduce((sum, tax) => sum + tax.amount, 0);
}

/**
 * Format tax for display
 */
export function formatTaxBreakdown(taxes: TaxBreakdown[]): string {
    return taxes
        .map((tax) => `${tax.type.toUpperCase()} @ ${tax.rate}%: ₹${(tax.amount / 100).toFixed(2)}`)
        .join('\n');
}

/**
 * Validate GSTIN format (basic check)
 */
export function isValidGSTIN(gstin: string): boolean {
    // GSTIN format: 2 digits state code + 10 chars PAN + 1 digit entity + 1 char Z + 1 check digit
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin.toUpperCase());
}

/**
 * Extract state code from GSTIN
 */
export function getStateCodeFromGSTIN(gstin: string): string {
    return gstin.substring(0, 2);
}
