/**
 * Billing Module Exports
 */

// Service
export { BillingService, billingService } from './billing.service';

// Repository
export { BillingRepository, billingRepository } from './billing.repository';

// Routes
export { default as billingRoutes } from './billing.routes';

// Webhook
export { handleRazorpayWebhook } from './billing.webhook';

// Utils
export { createRazorpayOrder, verifyWebhookSignature, getRazorpayKeyId } from './billing.utils';

// Constants
export {
    BILLING_PERMISSIONS,
    BILLING_PROVIDER,
    PAYMENT_STATUS,
    RAZORPAY_EVENTS,
    BILLING_ERROR_CODES,
} from './billing.constants';

// Types
export type {
    CreateOrderInput,
    CreateOrderResponse,
    PaymentResponse,
    BillingContext,
    RazorpayWebhookPayload,
} from './billing.types';
