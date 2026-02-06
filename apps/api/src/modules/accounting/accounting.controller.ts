/**
 * Accounting Controller
 * READ-ONLY exports
 */
import type { Request, Response, NextFunction } from 'express';
import { accountingService } from './accounting.service';
import { dateRangeSchema } from './accounting.validator';
import type { AccountingContext, DateRangeFilter } from './accounting.types';

/**
 * Get GST Summary
 * GET /api/v1/accounting/gst-summary
 */
export async function getGSTSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const context = getContext(req);
        const { format, startDate, endDate } = dateRangeSchema.parse(req.query);
        const filter = getFilter(startDate, endDate);

        const result = await accountingService.getGSTSummary(context, filter);

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="gst-summary.csv"');
            res.send(result.csv);
        } else {
            res.json({ success: true, data: result.data });
        }
    } catch (error) {
        next(error);
    }
}

/**
 * Get Invoices Register
 * GET /api/v1/accounting/invoices
 */
export async function getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const context = getContext(req);
        const { format, startDate, endDate } = dateRangeSchema.parse(req.query);
        const filter = getFilter(startDate, endDate);

        const result = await accountingService.getInvoiceRegister(context, filter);

        if (format === 'csv' || format === 'tally') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="invoices-${format}.csv"`);

            if (format === 'tally') {
                const tally = await accountingService.getTallyExport(context, filter);
                res.send(tally.invoices);
            } else {
                res.send(result.csv);
            }
        } else {
            res.json({ success: true, data: result.data });
        }
    } catch (error) {
        next(error);
    }
}

/**
 * Get Credit Notes Register
 * GET /api/v1/accounting/credit-notes
 */
export async function getCreditNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const context = getContext(req);
        const { format, startDate, endDate } = dateRangeSchema.parse(req.query);
        const filter = getFilter(startDate, endDate);

        const result = await accountingService.getCreditNoteRegister(context, filter);

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="credit-notes.csv"');
            res.send(result.csv);
        } else {
            res.json({ success: true, data: result.data });
        }
    } catch (error) {
        next(error);
    }
}

/**
 * Get Payments Register
 * GET /api/v1/accounting/payments
 */
export async function getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const context = getContext(req);
        const { format, startDate, endDate } = dateRangeSchema.parse(req.query);
        const filter = getFilter(startDate, endDate);

        const result = await accountingService.getPaymentRegister(context, filter);

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="payments.csv"');
            res.send(result.csv);
        } else {
            res.json({ success: true, data: result.data });
        }
    } catch (error) {
        next(error);
    }
}

/**
 * Get Revenue Summary
 * GET /api/v1/accounting/revenue
 */
export async function getRevenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const context = getContext(req);
        const { format, startDate, endDate } = dateRangeSchema.parse(req.query);
        const filter = getFilter(startDate, endDate);

        const result = await accountingService.getRevenueSummary(context, filter);

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="revenue-summary.csv"');
            res.send(result.csv);
        } else {
            res.json({ success: true, data: result.data });
        }
    } catch (error) {
        next(error);
    }
}

/**
 * Get Receivables
 * GET /api/v1/accounting/receivables
 */
export async function getReceivables(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const context = getContext(req);
        const { format } = dateRangeSchema.parse(req.query);

        const result = await accountingService.getReceivables(context);

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="receivables.csv"');
            res.send(result.csv);
        } else {
            res.json({ success: true, data: result.data });
        }
    } catch (error) {
        next(error);
    }
}

function getContext(req: Request): AccountingContext {
    const user = (req as Request & { user?: { tenantId: string; id: string } }).user;
    if (!user) throw new Error('User context not found');
    return { tenantId: user.tenantId, userId: user.id };
}

function getFilter(startDate?: string, endDate?: string): DateRangeFilter | undefined {
    if (!startDate && !endDate) return undefined;
    return {
        startDate: startDate ? new Date(startDate) : new Date(0),
        endDate: endDate ? new Date(endDate) : new Date(),
    };
}
