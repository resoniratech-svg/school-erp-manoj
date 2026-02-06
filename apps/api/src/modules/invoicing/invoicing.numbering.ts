/**
 * Invoice Numbering
 * India-compliant invoice number generation
 * Format: INV-{FY}-{SEQUENCE}
 */
import { invoicingRepository } from './invoicing.repository';

/**
 * Get fiscal year string (April to March)
 * e.g., 2025 for FY 2025-26 (April 2025 - March 2026)
 */
export function getFiscalYear(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    // If before April, use previous year
    if (month < 3) {
        return String(year - 1);
    }
    return String(year);
}

/**
 * Generate next invoice number
 * Format: INV-2025-000001
 */
export async function generateInvoiceNumber(): Promise<string> {
    const fiscalYear = getFiscalYear();
    const sequence = await invoicingRepository.getNextSequence(fiscalYear);
    const paddedSequence = String(sequence).padStart(6, '0');

    return `INV-${fiscalYear}-${paddedSequence}`;
}

/**
 * Parse invoice number
 */
export function parseInvoiceNumber(invoiceNumber: string): {
    prefix: string;
    fiscalYear: string;
    sequence: number;
} | null {
    const match = invoiceNumber.match(/^INV-(\d{4})-(\d+)$/);
    if (!match) return null;

    return {
        prefix: 'INV',
        fiscalYear: match[1],
        sequence: parseInt(match[2], 10),
    };
}
