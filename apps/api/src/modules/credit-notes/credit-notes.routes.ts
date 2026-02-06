/**
 * Credit Notes Routes
 * NO UPDATE, NO DELETE
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { CREDIT_NOTE_PERMISSIONS } from './credit-notes.constants';
import {
    listCreditNotes,
    getCreditNote,
    createCreditNote,
    downloadCreditNotePDF,
} from './credit-notes.controller';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/credit-notes
 */
router.get('/', requirePermission(CREDIT_NOTE_PERMISSIONS.READ), listCreditNotes);

/**
 * POST /api/v1/credit-notes/create
 */
router.post('/create', requirePermission(CREDIT_NOTE_PERMISSIONS.CREATE), createCreditNote);

/**
 * GET /api/v1/credit-notes/:id
 */
router.get('/:id', requirePermission(CREDIT_NOTE_PERMISSIONS.READ), getCreditNote);

/**
 * GET /api/v1/credit-notes/:id/pdf
 */
router.get('/:id/pdf', requirePermission(CREDIT_NOTE_PERMISSIONS.READ), downloadCreditNotePDF);

// NO PUT - Credit notes are immutable
// NO DELETE - Credit notes are append-only

export default router;
