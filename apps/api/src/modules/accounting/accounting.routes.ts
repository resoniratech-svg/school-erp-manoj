/**
 * Accounting Routes
 * READ-ONLY exports - NO write operations
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { ACCOUNTING_PERMISSIONS } from './accounting.constants';
import {
    getGSTSummary,
    getInvoices,
    getCreditNotes,
    getPayments,
    getRevenue,
    getReceivables,
} from './accounting.controller';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/accounting/gst-summary
 */
router.get('/gst-summary', requirePermission(ACCOUNTING_PERMISSIONS.READ), getGSTSummary);

/**
 * GET /api/v1/accounting/invoices
 */
router.get('/invoices', requirePermission(ACCOUNTING_PERMISSIONS.EXPORT), getInvoices);

/**
 * GET /api/v1/accounting/credit-notes
 */
router.get('/credit-notes', requirePermission(ACCOUNTING_PERMISSIONS.EXPORT), getCreditNotes);

/**
 * GET /api/v1/accounting/payments
 */
router.get('/payments', requirePermission(ACCOUNTING_PERMISSIONS.EXPORT), getPayments);

/**
 * GET /api/v1/accounting/revenue
 */
router.get('/revenue', requirePermission(ACCOUNTING_PERMISSIONS.READ), getRevenue);

/**
 * GET /api/v1/accounting/receivables
 */
router.get('/receivables', requirePermission(ACCOUNTING_PERMISSIONS.READ), getReceivables);

// NO POST - Read-only module
// NO PUT - Read-only module
// NO DELETE - Read-only module

export default router;
