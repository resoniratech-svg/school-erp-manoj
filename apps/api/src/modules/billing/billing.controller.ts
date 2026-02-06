/**
 * Billing Controller
 * Route handlers for billing operations
 */
import type { Request, Response, NextFunction } from 'express';
import { billingService } from './billing.service';
import { handleRazorpayWebhook } from './billing.webhook';
import { createOrderSchema } from './billing.validator';
import type { BillingContext } from './billing.types';

/**
 * Create Razorpay order
 * POST /api/v1/billing/create-order
 */
export async function createOrder(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const body = createOrderSchema.parse(req.body);

        const order = await billingService.createOrder(body.planCode, context);

        res.json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
}

/**
 * Razorpay Webhook (NO AUTH)
 * POST /api/v1/billing/webhook
 * 
 * CRITICAL: This endpoint receives raw body for signature verification
 */
export async function webhook(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const signature = req.headers['x-razorpay-signature'] as string;

        if (!signature) {
            res.status(400).json({ success: false, message: 'Missing signature' });
            return;
        }

        // Get raw body (requires raw body middleware)
        const rawBody = (req as Request & { rawBody?: Buffer }).rawBody || JSON.stringify(req.body);

        const result = await handleRazorpayWebhook(rawBody, signature);

        if (result.success) {
            res.status(200).json({ success: true, message: result.message });
        } else {
            // Return 200 for invalid signature to prevent Razorpay retries
            // But log the issue
            res.status(200).json({ success: false, message: result.message });
        }
    } catch (error) {
        // Always return 200 to prevent Razorpay retries on server errors
        console.error('Webhook error:', error);
        res.status(200).json({ success: false, message: 'Internal error' });
    }
}

/**
 * Get payments for tenant
 * GET /api/v1/billing/payments
 */
export async function getPayments(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const context = getContext(req);
        const payments = await billingService.getPaymentsByTenant(context.tenantId);

        res.json({ success: true, data: payments });
    } catch (error) {
        next(error);
    }
}

/**
 * Extract context from request
 */
function getContext(req: Request): BillingContext {
    const user = (req as Request & { user?: { tenantId: string; id: string; branchId?: string } }).user;
    if (!user) {
        throw new Error('User context not found');
    }
    return {
        tenantId: user.tenantId,
        userId: user.id,
        branchId: user.branchId,
    };
}
