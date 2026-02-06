/**
 * Billing Repository
 * Append-only payment records
 * NO DELETE operations
 */
import { prisma } from '@school-erp/database';
import type { Payment, PaymentStatus } from '@prisma/client';

export class BillingRepository {
    /**
     * Create payment record (append-only)
     */
    async createPayment(data: {
        tenantId: string;
        subscriptionId: string;
        planId: string;
        provider: string;
        providerOrderId: string;
        amount: number;
        currency: string;
        status: PaymentStatus;
        metadata?: Record<string, unknown>;
    }): Promise<Payment> {
        return prisma.payment.create({
            data: {
                tenantId: data.tenantId,
                subscriptionId: data.subscriptionId,
                planId: data.planId,
                provider: data.provider,
                providerOrderId: data.providerOrderId,
                amount: data.amount,
                currency: data.currency,
                status: data.status,
                metadata: data.metadata,
            },
        });
    }

    /**
     * Get payment by provider order ID
     */
    async getByProviderOrderId(providerOrderId: string): Promise<Payment | null> {
        return prisma.payment.findUnique({
            where: { providerOrderId },
        });
    }

    /**
     * Update payment status (only status and payment ID - append semantics)
     */
    async updatePaymentStatus(
        providerOrderId: string,
        status: PaymentStatus,
        providerPaymentId?: string
    ): Promise<Payment> {
        return prisma.payment.update({
            where: { providerOrderId },
            data: {
                status,
                providerPaymentId,
            },
        });
    }

    /**
     * Get payments by tenant
     */
    async getByTenantId(tenantId: string): Promise<Payment[]> {
        return prisma.payment.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Check if payment exists by order ID (for idempotency)
     */
    async existsByProviderOrderId(providerOrderId: string): Promise<boolean> {
        const count = await prisma.payment.count({
            where: { providerOrderId },
        });
        return count > 0;
    }

    // NO DELETE OPERATIONS - Payments are append-only
}

export const billingRepository = new BillingRepository();
