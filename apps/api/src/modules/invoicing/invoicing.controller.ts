/**
 * Invoicing Controller
 */
import type { Request, Response, NextFunction } from 'express';
import { invoicingService } from './invoicing.service';
import { generateInvoicePDF, generateInvoiceHTML } from './pdf/invoice.pdf';
import { generateInvoiceSchema } from './invoicing.validator';
import type { InvoiceContext } from './invoicing.types';

/**
 * List invoices
 * GET /api/v1/invoices
 */
export async function listInvoices(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const invoices = await invoicingService.listInvoices(context.tenantId, { limit, offset });

        res.json({ success: true, data: invoices });
    } catch (error) {
        next(error);
    }
}

/**
 * Get invoice by ID
 * GET /api/v1/invoices/:id
 */
export async function getInvoice(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const invoice = await invoicingService.getInvoice(req.params.id, context.tenantId);

        res.json({ success: true, data: invoice });
    } catch (error) {
        next(error);
    }
}

/**
 * Generate invoice
 * POST /api/v1/invoices/generate
 */
export async function generateInvoice(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const body = generateInvoiceSchema.parse(req.body);

        const invoice = await invoicingService.generateInvoice(
            {
                tenantId: context.tenantId,
                billingPeriodStart: body.billingPeriodStart ? new Date(body.billingPeriodStart) : undefined,
                billingPeriodEnd: body.billingPeriodEnd ? new Date(body.billingPeriodEnd) : undefined,
                gstin: body.gstin,
                placeOfSupply: body.placeOfSupply,
            },
            context
        );

        res.status(201).json({ success: true, data: invoice });
    } catch (error) {
        next(error);
    }
}

/**
 * Download invoice PDF
 * GET /api/v1/invoices/:id/pdf
 */
export async function downloadInvoicePDF(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const invoice = await invoicingService.getInvoice(req.params.id, context.tenantId);

        // For now, return HTML (in production, use puppeteer for PDF)
        const html = generateInvoiceHTML(invoice);

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.html"`);
        res.send(html);
    } catch (error) {
        next(error);
    }
}

/**
 * Extract context from request
 */
function getContext(req: Request): InvoiceContext {
    const user = (req as Request & { user?: { tenantId: string; id: string } }).user;
    if (!user) {
        throw new Error('User context not found');
    }
    return {
        tenantId: user.tenantId,
        userId: user.id,
    };
}
