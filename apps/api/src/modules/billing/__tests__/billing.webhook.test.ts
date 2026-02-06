/**
 * Billing Webhook Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { handleRazorpayWebhook } from '../billing.webhook';
import { BILLING_ERROR_CODES } from '../billing.constants';

// Mock repositories
vi.mock('../billing.repository', () => ({
    billingRepository: {
        getByProviderOrderId: vi.fn(),
        updatePaymentStatus: vi.fn(),
    },
}));

vi.mock('../../subscription/subscription.repository', () => ({
    subscriptionRepository: {
        getByTenantId: vi.fn(),
        getPlanById: vi.fn(),
        update: vi.fn(),
    },
}));

vi.mock('../../config/config.service', () => ({
    configService: {
        batchUpdateConfigs: vi.fn().mockResolvedValue([]),
    },
}));

import { billingRepository } from '../billing.repository';
import { subscriptionRepository } from '../../subscription/subscription.repository';

describe('Billing Webhook', () => {
    const webhookSecret = 'test_webhook_secret';

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
    });

    function createSignature(body: string): string {
        return crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');
    }

    const mockPayment = {
        id: 'payment-id',
        tenantId: 'tenant-123',
        subscriptionId: 'sub-id',
        planId: 'plan-id',
        amount: 149900,
        status: 'created',
    };

    const mockSubscription = {
        id: 'sub-id',
        tenantId: 'tenant-123',
        planId: 'plan-free-id',
        status: 'trialing',
    };

    const mockPlan = {
        id: 'plan-id',
        code: 'BASIC',
        priceMonthly: 149900,
    };

    describe('Signature Verification', () => {
        it('should reject invalid signature', async () => {
            const payload = JSON.stringify({ event: 'payment.captured' });
            const invalidSignature = 'invalid_signature';

            const result = await handleRazorpayWebhook(payload, invalidSignature);

            expect(result.success).toBe(false);
            expect(result.message).toBe(BILLING_ERROR_CODES.INVALID_SIGNATURE);
        });

        it('should accept valid signature', async () => {
            const payload = JSON.stringify({ event: 'unknown.event' });
            const signature = createSignature(payload);

            const result = await handleRazorpayWebhook(payload, signature);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Event ignored');
        });
    });

    describe('Payment Captured', () => {
        it('should activate subscription on valid payment', async () => {
            const payload = JSON.stringify({
                event: 'payment.captured',
                payload: {
                    payment: {
                        entity: {
                            id: 'pay_123',
                            order_id: 'order_123',
                            amount: 149900,
                        },
                    },
                },
            });
            const signature = createSignature(payload);

            (billingRepository.getByProviderOrderId as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayment);
            (billingRepository.updatePaymentStatus as ReturnType<typeof vi.fn>).mockResolvedValue({});
            (subscriptionRepository.getByTenantId as ReturnType<typeof vi.fn>).mockResolvedValue(mockSubscription);
            (subscriptionRepository.getPlanById as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlan);
            (subscriptionRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const result = await handleRazorpayWebhook(payload, signature);

            expect(result.success).toBe(true);
            expect(result.processed).toBe(true);
            expect(subscriptionRepository.update).toHaveBeenCalledWith('tenant-123', {
                planId: 'plan-id',
                status: 'active',
                trialEndsAt: null,
                endsAt: null,
            });
        });

        it('should be idempotent - ignore already processed payment', async () => {
            const payload = JSON.stringify({
                event: 'payment.captured',
                payload: {
                    payment: {
                        entity: {
                            id: 'pay_123',
                            order_id: 'order_123',
                            amount: 149900,
                        },
                    },
                },
            });
            const signature = createSignature(payload);

            (billingRepository.getByProviderOrderId as ReturnType<typeof vi.fn>).mockResolvedValue({
                ...mockPayment,
                status: 'paid', // Already processed
            });

            const result = await handleRazorpayWebhook(payload, signature);

            expect(result.success).toBe(true);
            expect(result.processed).toBe(false);
            expect(result.message).toBe('Already processed');
            expect(subscriptionRepository.update).not.toHaveBeenCalled();
        });

        it('should reject amount mismatch', async () => {
            const payload = JSON.stringify({
                event: 'payment.captured',
                payload: {
                    payment: {
                        entity: {
                            id: 'pay_123',
                            order_id: 'order_123',
                            amount: 100000, // Wrong amount
                        },
                    },
                },
            });
            const signature = createSignature(payload);

            (billingRepository.getByProviderOrderId as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayment);
            (billingRepository.updatePaymentStatus as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const result = await handleRazorpayWebhook(payload, signature);

            expect(result.success).toBe(false);
            expect(result.message).toBe(BILLING_ERROR_CODES.AMOUNT_MISMATCH);
            expect(billingRepository.updatePaymentStatus).toHaveBeenCalledWith(
                'order_123',
                'failed',
                'pay_123'
            );
        });

        it('should reject if payment record not found', async () => {
            const payload = JSON.stringify({
                event: 'payment.captured',
                payload: {
                    payment: {
                        entity: {
                            id: 'pay_123',
                            order_id: 'order_unknown',
                            amount: 149900,
                        },
                    },
                },
            });
            const signature = createSignature(payload);

            (billingRepository.getByProviderOrderId as ReturnType<typeof vi.fn>).mockResolvedValue(null);

            const result = await handleRazorpayWebhook(payload, signature);

            expect(result.success).toBe(false);
            expect(result.message).toBe(BILLING_ERROR_CODES.PAYMENT_NOT_FOUND);
        });
    });

    describe('Payment Failed', () => {
        it('should mark payment as failed', async () => {
            const payload = JSON.stringify({
                event: 'payment.failed',
                payload: {
                    payment: {
                        entity: {
                            id: 'pay_123',
                            order_id: 'order_123',
                            error_description: 'Card declined',
                        },
                    },
                },
            });
            const signature = createSignature(payload);

            (billingRepository.getByProviderOrderId as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayment);
            (billingRepository.updatePaymentStatus as ReturnType<typeof vi.fn>).mockResolvedValue({});

            const result = await handleRazorpayWebhook(payload, signature);

            expect(result.success).toBe(true);
            expect(result.processed).toBe(true);
            expect(billingRepository.updatePaymentStatus).toHaveBeenCalledWith(
                'order_123',
                'failed',
                'pay_123'
            );
            expect(subscriptionRepository.update).not.toHaveBeenCalled();
        });
    });
});
