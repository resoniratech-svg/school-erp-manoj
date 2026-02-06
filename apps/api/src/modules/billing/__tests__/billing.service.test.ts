/**
 * Billing Service Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillingService } from '../billing.service';
import { BILLING_ERROR_CODES } from '../billing.constants';

// Mock repository
const mockBillingRepository = {
    createPayment: vi.fn(),
    getByProviderOrderId: vi.fn(),
    updatePaymentStatus: vi.fn(),
    getByTenantId: vi.fn(),
    existsByProviderOrderId: vi.fn(),
};

// Mock subscription repository
vi.mock('../../subscription/subscription.repository', () => ({
    subscriptionRepository: {
        getByTenantId: vi.fn(),
        getPlanByCode: vi.fn(),
    },
}));

// Mock utils
vi.mock('../billing.utils', () => ({
    createRazorpayOrder: vi.fn().mockResolvedValue({
        id: 'order_test123',
        amount: 149900,
        currency: 'INR',
    }),
    getRazorpayKeyId: vi.fn().mockReturnValue('rzp_test_key'),
}));

import { subscriptionRepository } from '../../subscription/subscription.repository';

describe('BillingService', () => {
    let service: BillingService;

    const mockSubscription = {
        id: 'sub-id',
        tenantId: 'tenant-123',
        planId: 'plan-free-id',
        status: 'trialing',
        plan: { code: 'FREE', priceMonthly: 0 },
    };

    const mockBasicPlan = {
        id: 'plan-basic-id',
        code: 'BASIC',
        name: 'Basic',
        priceMonthly: 149900,
        isActive: true,
    };

    const mockContext = {
        tenantId: 'tenant-123',
        userId: 'user-123',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        service = new BillingService(mockBillingRepository as never);
    });

    describe('createOrder', () => {
        it('should create Razorpay order for valid plan', async () => {
            (subscriptionRepository.getByTenantId as ReturnType<typeof vi.fn>).mockResolvedValue(mockSubscription);
            (subscriptionRepository.getPlanByCode as ReturnType<typeof vi.fn>).mockResolvedValue(mockBasicPlan);
            mockBillingRepository.createPayment.mockResolvedValue({
                id: 'payment-id',
                providerOrderId: 'order_test123',
            });

            const result = await service.createOrder('BASIC', mockContext);

            expect(result.orderId).toBe('order_test123');
            expect(result.amount).toBe(149900);
            expect(result.currency).toBe('INR');
            expect(result.key).toBe('rzp_test_key');
            expect(mockBillingRepository.createPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    tenantId: 'tenant-123',
                    amount: 149900,
                    status: 'created',
                })
            );
        });

        it('should reject FREE plan (not payable)', async () => {
            (subscriptionRepository.getByTenantId as ReturnType<typeof vi.fn>).mockResolvedValue(mockSubscription);
            (subscriptionRepository.getPlanByCode as ReturnType<typeof vi.fn>).mockResolvedValue({
                ...mockBasicPlan,
                code: 'FREE',
                priceMonthly: 0,
            });

            await expect(service.createOrder('FREE', mockContext)).rejects.toThrow(
                BILLING_ERROR_CODES.PLAN_NOT_PAYABLE
            );
        });

        it('should reject inactive plan', async () => {
            (subscriptionRepository.getByTenantId as ReturnType<typeof vi.fn>).mockResolvedValue(mockSubscription);
            (subscriptionRepository.getPlanByCode as ReturnType<typeof vi.fn>).mockResolvedValue({
                ...mockBasicPlan,
                isActive: false,
            });

            await expect(service.createOrder('BASIC', mockContext)).rejects.toThrow(
                'Plan is not active'
            );
        });

        it('should reject if subscription not found', async () => {
            (subscriptionRepository.getByTenantId as ReturnType<typeof vi.fn>).mockResolvedValue(null);

            await expect(service.createOrder('BASIC', mockContext)).rejects.toThrow(
                BILLING_ERROR_CODES.SUBSCRIPTION_NOT_FOUND
            );
        });

        it('should reject if plan not found', async () => {
            (subscriptionRepository.getByTenantId as ReturnType<typeof vi.fn>).mockResolvedValue(mockSubscription);
            (subscriptionRepository.getPlanByCode as ReturnType<typeof vi.fn>).mockResolvedValue(null);

            await expect(service.createOrder('UNKNOWN', mockContext)).rejects.toThrow(
                'Plan not found'
            );
        });
    });
});
