/**
 * Billing Webhook Handler
 * CRITICAL: This is the ONLY place that activates subscriptions
 * All payment confirmations come through here
 */
import { billingRepository } from './billing.repository';
import { subscriptionRepository } from '../subscription/subscription.repository';
import { configService } from '../config/config.service';
import { PLAN_CONFIGS } from '../subscription/subscription.constants';
import { verifyWebhookSignature } from './billing.utils';
import {
    RAZORPAY_EVENTS,
    PAYMENT_STATUS,
    BILLING_ERROR_CODES,
} from './billing.constants';
import type { RazorpayWebhookPayload } from './billing.types';
import { getLogger } from '../../utils/logger';

const logger = getLogger('billing-webhook');

export interface WebhookResult {
    success: boolean;
    message: string;
    processed: boolean;
}

/**
 * Handle Razorpay webhook
 * MUST be idempotent - same webhook can be sent multiple times
 */
export async function handleRazorpayWebhook(
    rawBody: string | Buffer,
    signature: string
): Promise<WebhookResult> {
    // 1. Verify signature first - reject immediately if invalid
    if (!verifyWebhookSignature(rawBody, signature)) {
        logger.warn('Webhook rejected: invalid signature');
        return {
            success: false,
            message: BILLING_ERROR_CODES.INVALID_SIGNATURE,
            processed: false,
        };
    }

    // 2. Parse payload
    let payload: RazorpayWebhookPayload;
    try {
        payload = JSON.parse(rawBody.toString());
    } catch (error) {
        logger.error(`Webhook parse error: ${error}`);
        return {
            success: false,
            message: 'Invalid payload',
            processed: false,
        };
    }

    const event = payload.event;
    logger.info(`Processing webhook event: ${event}`);

    // 3. Handle supported events
    switch (event) {
        case RAZORPAY_EVENTS.PAYMENT_CAPTURED:
            return handlePaymentCaptured(payload);

        case RAZORPAY_EVENTS.PAYMENT_FAILED:
            return handlePaymentFailed(payload);

        default:
            logger.info(`Ignoring unsupported event: ${event}`);
            return {
                success: true,
                message: 'Event ignored',
                processed: false,
            };
    }
}

/**
 * Handle payment.captured event
 * THIS IS THE ONLY PLACE THAT ACTIVATES SUBSCRIPTIONS
 */
async function handlePaymentCaptured(
    payload: RazorpayWebhookPayload
): Promise<WebhookResult> {
    const paymentEntity = payload.payload.payment?.entity;
    if (!paymentEntity) {
        return { success: false, message: 'Missing payment entity', processed: false };
    }

    const { id: paymentId, order_id: orderId, amount } = paymentEntity;

    logger.info(`Payment captured: paymentId=${paymentId}, orderId=${orderId}, amount=${amount}`);

    // 1. Get payment record
    const payment = await billingRepository.getByProviderOrderId(orderId);
    if (!payment) {
        logger.warn(`Payment record not found for order: ${orderId}`);
        return { success: false, message: BILLING_ERROR_CODES.PAYMENT_NOT_FOUND, processed: false };
    }

    // 2. Idempotency check - if already processed, return success
    if (payment.status === 'paid') {
        logger.info(`Payment already processed (idempotent): ${orderId}`);
        return { success: true, message: 'Already processed', processed: false };
    }

    // 3. Amount verification - CRITICAL
    if (amount !== payment.amount) {
        logger.error(`Amount mismatch: expected=${payment.amount}, received=${amount}`);
        await billingRepository.updatePaymentStatus(orderId, 'failed', paymentId);
        return { success: false, message: BILLING_ERROR_CODES.AMOUNT_MISMATCH, processed: false };
    }

    // 4. Update payment status to paid
    await billingRepository.updatePaymentStatus(orderId, 'paid', paymentId);

    // 5. Get subscription and plan
    const subscription = await subscriptionRepository.getByTenantId(payment.tenantId);
    if (!subscription) {
        logger.error(`Subscription not found for tenant: ${payment.tenantId}`);
        return { success: false, message: 'Subscription not found', processed: false };
    }

    // 6. Get target plan from payment
    const plan = await subscriptionRepository.getPlanById(payment.planId);
    if (!plan) {
        logger.error(`Plan not found: ${payment.planId}`);
        return { success: false, message: 'Plan not found', processed: false };
    }

    // 7. ACTIVATE SUBSCRIPTION - This is the ONLY place this happens
    await subscriptionRepository.update(payment.tenantId, {
        planId: plan.id,
        status: 'active',
        trialEndsAt: null,
        endsAt: null, // Will implement renewal logic in future
    });

    // 8. Apply plan configs
    await applyPlanConfigs(payment.tenantId, plan.code);

    logger.info(
        `Subscription activated via webhook: tenant=${payment.tenantId}, plan=${plan.code}`
    );

    return { success: true, message: 'Payment processed', processed: true };
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(
    payload: RazorpayWebhookPayload
): Promise<WebhookResult> {
    const paymentEntity = payload.payload.payment?.entity;
    if (!paymentEntity) {
        return { success: false, message: 'Missing payment entity', processed: false };
    }

    const { id: paymentId, order_id: orderId, error_description } = paymentEntity;

    logger.warn(`Payment failed: paymentId=${paymentId}, orderId=${orderId}, error=${error_description}`);

    // Get payment record
    const payment = await billingRepository.getByProviderOrderId(orderId);
    if (!payment) {
        logger.warn(`Payment record not found for order: ${orderId}`);
        return { success: false, message: BILLING_ERROR_CODES.PAYMENT_NOT_FOUND, processed: false };
    }

    // Idempotency check
    if (payment.status === 'failed') {
        return { success: true, message: 'Already processed', processed: false };
    }

    // Update payment status to failed
    await billingRepository.updatePaymentStatus(orderId, 'failed', paymentId);

    logger.info(`Payment marked as failed: ${orderId}`);

    return { success: true, message: 'Payment failure recorded', processed: true };
}

/**
 * Apply plan-specific configs
 */
async function applyPlanConfigs(tenantId: string, planCode: string): Promise<void> {
    const configs = PLAN_CONFIGS[planCode];
    if (!configs) {
        logger.warn(`No config defaults found for plan ${planCode}`);
        return;
    }

    const configUpdates = Object.entries(configs).map(([key, value]) => ({
        key,
        value,
    }));

    try {
        await configService.batchUpdateConfigs(
            { configs: configUpdates, scope: 'TENANT' },
            { tenantId, userId: 'webhook' }
        );

        logger.info(`Applied ${configUpdates.length} configs for plan ${planCode}`);
    } catch (error) {
        logger.error(`Failed to apply plan configs: ${error}`);
        // Don't throw - subscription is already activated
    }
}
