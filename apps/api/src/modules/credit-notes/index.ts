/**
 * Credit Notes Module Exports
 */

export { CreditNotesService, creditNotesService } from './credit-notes.service';
export { CreditNotesRepository, creditNotesRepository } from './credit-notes.repository';
export { default as creditNotesRoutes } from './credit-notes.routes';
export { generateCreditNoteNumber } from './credit-notes.numbering';
export { generateCreditNoteHTML, generateCreditNotePDF } from './pdf/credit-note.pdf';

export {
    CREDIT_NOTE_STATUS,
    CREDIT_REASON,
    CREDIT_REASON_LABELS,
    CREDIT_NOTE_PERMISSIONS,
} from './credit-notes.constants';

export type {
    CreditNoteResponse,
    CreateCreditNoteInput,
} from './credit-notes.types';
