/**
 * Billing Utils - Razorpay SDK Wrapper
 * Provider-agnostic abstraction for payment operations
 */
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getLogger } from '../../utils/logger';
import type { RazorpayOrder } from './billing.types';

const logger = getLogger('billing-utils');

// Razorpay instance (lazy initialization)
let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
    if (!razorpayInstance) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error('Razorpay credentials not configured');
        }

        razorpayInstance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }
    return razorpayInstance;
}

/**
 * Create Razorpay order
 */
export async function createRazorpayOrder(
    amount: number, // in paise
    currency: string,
    receipt: string,
    notes: Record<string, string>
): Promise<RazorpayOrder> {
    const razorpay = getRazorpay();

    logger.info(`Creating Razorpay order: amount=${amount}, currency=${currency}, receipt=${receipt}`);

    const order = await razorpay.orders.create({
        amount,
        currency,
        receipt,
        notes,
    });

    return order as RazorpayOrder;
}

/**
 * Verify webhook signature
 * CRITICAL: Must reject invalid signatures immediately
 */
export function verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string
): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
        logger.error('RAZORPAY_WEBHOOK_SECRET not configured');
        return false;
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );

        if (!isValid) {
            logger.warn('Webhook signature verification failed');
        }

        return isValid;
    } catch (error) {
        logger.error(`Webhook signature verification error: ${error}`);
        return false;
    }
}

/**
 * Get Razorpay public key for frontend
 */
export function getRazorpayKeyId(): string {
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
        throw new Error('RAZORPAY_KEY_ID not configured');
    }
    return keyId;
}
