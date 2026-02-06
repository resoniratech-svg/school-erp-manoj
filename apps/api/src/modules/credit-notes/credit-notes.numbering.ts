/**
 * Credit Note Numbering
 * Format: CN-{FY}-{SEQUENCE}
 */
import { creditNotesRepository } from './credit-notes.repository';

/**
 * Get fiscal year string (April to March)
 */
function getFiscalYear(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month < 3) {
        return String(year - 1);
    }
    return String(year);
}

/**
 * Generate next credit note number
 * Format: CN-2025-000001
 */
export async function generateCreditNoteNumber(): Promise<string> {
    const fiscalYear = getFiscalYear();
    const sequence = await creditNotesRepository.getNextSequence(fiscalYear);
    const paddedSequence = String(sequence).padStart(6, '0');
    return `CN-${fiscalYear}-${paddedSequence}`;
}
