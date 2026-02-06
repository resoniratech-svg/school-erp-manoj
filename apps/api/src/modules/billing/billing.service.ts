/**
 * Billing Service
 * Order creation ONLY - NO subscription activation
 * Subscription activation happens ONLY via webhook
 */
import { NotFoundError, BadRequestError } from '@school-erp/shared';
import { BillingRepository, billingRepository } from './billing.repository';
import { subscriptionRepository } from '../subscription/subscription.repository';
import { createRazorpayOrder, getRazorpayKeyId } from './billing.utils';
import {
    BILLING_PROVIDER,
    BILLING_ERROR_CODES,
    PAYMENT_STATUS,
    CURRENCY,
} from './billing.constants';
import type { CreateOrderResponse, BillingContext, PaymentResponse } from './billing.types';
import type { Payment } from '@prisma/client';
import { getLogger } from '../../utils/logger';

const logger = getLogger('billing-service');

export class BillingService {
    constructor(private readonly repository: BillingRepository = billingRepository) { }

    /**
     * Create Razorpay order for plan upgrade
     * DOES NOT activate subscription - only creates order
     */
    async createOrder(
        planCode: string,
        context: BillingContext
    ): Promise<CreateOrderResponse> {
        // Get subscription
        const subscription = await subscriptionRepository.getByTenantId(context.tenantId);
        if (!subscription) {
            throw new NotFoundError(BILLING_ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
        }

        // Get target plan
        const plan = await subscriptionRepository.getPlanByCode(planCode);
        if (!plan) {
            throw new NotFoundError('Plan not found');
        }

        // Validate plan is payable (not FREE)
        if (plan.priceMonthly === 0) {
            throw new BadRequestError(BILLING_ERROR_CODES.PLAN_NOT_PAYABLE);
        }

        // Validate plan is active
        if (!plan.isActive) {
            throw new BadRequestError('Plan is not active');
        }

        // Create Razorpay order
        const receipt = `${context.tenantId.slice(0, 8)}_${Date.now()}`;
        const razorpayOrder = await createRazorpayOrder(
            plan.priceMonthly,
            CURRENCY.INR,
            receipt,
            {
                tenantId: context.tenantId,
                planCode: plan.code,
                planId: plan.id,
            }
        );

        // Create payment record with status = created
        await this.repository.createPayment({
            tenantId: context.tenantId,
            subscriptionId: subscription.id,
            planId: plan.id,
            provider: BILLING_PROVIDER.RAZORPAY,
            providerOrderId: razorpayOrder.id,
            amount: plan.priceMonthly,
            currency: CURRENCY.INR,
            status: 'created',
            metadata: {
                receipt,
                planCode: plan.code,
                userId: context.userId,
            },
        });

        logger.info(
            `Order created: orderId=${razorpayOrder.id}, tenant=${context.tenantId}, plan=${plan.code}, amount=${plan.priceMonthly}`
        );

        return {
            orderId: razorpayOrder.id,
            amount: plan.priceMonthly,
            currency: CURRENCY.INR,
            key: getRazorpayKeyId(),
            planCode: plan.code,
            planName: plan.name,
        };
    }

    /**
     * Get payment by order ID
     */
    async getPaymentByOrderId(providerOrderId: string): Promise<PaymentResponse | null> {
        const payment = await this.repository.getByProviderOrderId(providerOrderId);
        if (!payment) {
            return null;
        }
        return this.mapToResponse(payment);
    }

    /**
     * Get payments for tenant
     */
    async getPaymentsByTenant(tenantId: string): Promise<PaymentResponse[]> {
        const payments = await this.repository.getByTenantId(tenantId);
        return payments.map(this.mapToResponse);
    }

    /**
     * Map payment to response
     */
    private mapToResponse(payment: Payment): PaymentResponse {
        return {
            id: payment.id,
            tenantId: payment.tenantId,
            subscriptionId: payment.subscriptionId,
            provider: payment.provider,
            providerOrderId: payment.providerOrderId,
            providerPaymentId: payment.providerPaymentId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            createdAt: payment.createdAt.toISOString(),
        };
    }
}

export const billingService = new BillingService();
