/**
 * Credit Notes Controller
 */
import type { Request, Response, NextFunction } from 'express';
import { creditNotesService } from './credit-notes.service';
import { generateCreditNoteHTML } from './pdf/credit-note.pdf';
import { createCreditNoteSchema } from './credit-notes.validator';
import type { CreditNoteContext } from './credit-notes.types';

/**
 * List credit notes
 * GET /api/v1/credit-notes
 */
export async function listCreditNotes(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const notes = await creditNotesService.listCreditNotes(context.tenantId, { limit, offset });

        res.json({ success: true, data: notes });
    } catch (error) {
        next(error);
    }
}

/**
 * Get credit note by ID
 * GET /api/v1/credit-notes/:id
 */
export async function getCreditNote(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const note = await creditNotesService.getCreditNote(req.params.id, context.tenantId);

        res.json({ success: true, data: note });
    } catch (error) {
        next(error);
    }
}

/**
 * Create credit note
 * POST /api/v1/credit-notes/create
 */
export async function createCreditNote(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const body = createCreditNoteSchema.parse(req.body);

        const note = await creditNotesService.createCreditNote(body, context);

        res.status(201).json({ success: true, data: note });
    } catch (error) {
        next(error);
    }
}

/**
 * Download credit note PDF
 * GET /api/v1/credit-notes/:id/pdf
 */
export async function downloadCreditNotePDF(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const note = await creditNotesService.getCreditNote(req.params.id, context.tenantId);

        const html = generateCreditNoteHTML(note);

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${note.creditNumber}.html"`);
        res.send(html);
    } catch (error) {
        next(error);
    }
}

function getContext(req: Request): CreditNoteContext {
    const user = (req as Request & { user?: { tenantId: string; id: string } }).user;
    if (!user) {
        throw new Error('User context not found');
    }
    return {
        tenantId: user.tenantId,
        userId: user.id,
    };
}
