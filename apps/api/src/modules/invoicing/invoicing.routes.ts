/**
 * Invoicing Routes
 * Read-only + Generate endpoints
 * NO UPDATE, NO DELETE
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { INVOICE_PERMISSIONS } from './invoicing.constants';
import {
    listInvoices,
    getInvoice,
    generateInvoice,
    downloadInvoicePDF,
} from './invoicing.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/invoices
 * List invoices for tenant
 */
router.get('/', requirePermission(INVOICE_PERMISSIONS.READ), listInvoices);

/**
 * POST /api/v1/invoices/generate
 * Generate new invoice
 */
router.post('/generate', requirePermission(INVOICE_PERMISSIONS.GENERATE), generateInvoice);

/**
 * GET /api/v1/invoices/:id
 * Get invoice by ID
 */
router.get('/:id', requirePermission(INVOICE_PERMISSIONS.READ), getInvoice);

/**
 * GET /api/v1/invoices/:id/pdf
 * Download invoice PDF
 */
router.get('/:id/pdf', requirePermission(INVOICE_PERMISSIONS.READ), downloadInvoicePDF);

// NO PUT - Invoices are immutable
// NO DELETE - Invoices are append-only

export default router;
