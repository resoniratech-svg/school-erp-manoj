/**
 * Subscription Service Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubscriptionService } from '../subscription.service';
import { PLAN_CODES, SUBSCRIPTION_STATUS, TRIAL_CONFIG } from '../subscription.constants';

// Mock repository
const mockRepository = {
    exists: vi.fn(),
    getPlanByCode: vi.fn(),
    create: vi.fn(),
    getByTenantId: vi.fn(),
    update: vi.fn(),
    getPublicPlans: vi.fn(),
    getExpiredTrials: vi.fn(),
    markTrialsExpired: vi.fn(),
};

// Mock config service
vi.mock('../../config/config.service', () => ({
    configService: {
        batchUpdateConfigs: vi.fn().mockResolvedValue([]),
    },
}));

describe('SubscriptionService', () => {
    let service: SubscriptionService;

    const mockFreePlan = {
        id: 'plan-free-id',
        code: PLAN_CODES.FREE,
        name: 'Free',
        description: 'Free plan',
        priceMonthly: 0,
        isActive: true,
        isPublic: true,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockBasicPlan = {
        id: 'plan-basic-id',
        code: PLAN_CODES.BASIC,
        name: 'Basic',
        description: 'Basic plan',
        priceMonthly: 149900,
        isActive: true,
        isPublic: true,
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockSubscription = {
        id: 'sub-id',
        tenantId: 'tenant-123',
        planId: mockFreePlan.id,
        status: SUBSCRIPTION_STATUS.TRIALING,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        startedAt: new Date(),
        endsAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: mockFreePlan,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        service = new SubscriptionService(mockRepository as never);
    });

    describe('createTrialSubscription', () => {
        it('should create trial subscription for new tenant', async () => {
            mockRepository.exists.mockResolvedValue(false);
            mockRepository.getPlanByCode.mockResolvedValue(mockFreePlan);
            mockRepository.create.mockResolvedValue(mockSubscription);

            const result = await service.createTrialSubscription('tenant-123');

            expect(result.tenantId).toBe('tenant-123');
            expect(result.status).toBe(SUBSCRIPTION_STATUS.TRIALING);
            expect(result.plan.code).toBe(PLAN_CODES.FREE);
            expect(result.trialDaysRemaining).toBeGreaterThan(0);
            expect(result.trialDaysRemaining).toBeLessThanOrEqual(TRIAL_CONFIG.DURATION_DAYS);
        });

        it('should throw if subscription already exists', async () => {
            mockRepository.exists.mockResolvedValue(true);

            await expect(service.createTrialSubscription('tenant-123')).rejects.toThrow();
        });

        it('should throw if FREE plan not found', async () => {
            mockRepository.exists.mockResolvedValue(false);
            mockRepository.getPlanByCode.mockResolvedValue(null);

            await expect(service.createTrialSubscription('tenant-123')).rejects.toThrow();
        });
    });

    describe('getCurrentSubscription', () => {
        it('should return subscription for tenant', async () => {
            mockRepository.getByTenantId.mockResolvedValue(mockSubscription);

            const result = await service.getCurrentSubscription('tenant-123');

            expect(result).not.toBeNull();
            expect(result?.tenantId).toBe('tenant-123');
        });

        it('should return null if no subscription', async () => {
            mockRepository.getByTenantId.mockResolvedValue(null);

            const result = await service.getCurrentSubscription('tenant-123');

            expect(result).toBeNull();
        });
    });

    describe('changePlan', () => {
        it('should change plan successfully', async () => {
            mockRepository.getByTenantId.mockResolvedValue(mockSubscription);
            mockRepository.getPlanByCode.mockResolvedValue(mockBasicPlan);
            mockRepository.update.mockResolvedValue({
                ...mockSubscription,
                planId: mockBasicPlan.id,
                status: SUBSCRIPTION_STATUS.ACTIVE,
                trialEndsAt: null,
                plan: mockBasicPlan,
            });

            const result = await service.changePlan('tenant-123', PLAN_CODES.BASIC, {
                tenantId: 'tenant-123',
                userId: 'user-123',
            });

            expect(result.plan.code).toBe(PLAN_CODES.BASIC);
            expect(result.status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
            expect(result.trialEndsAt).toBeNull();
        });

        it('should throw if subscription not found', async () => {
            mockRepository.getByTenantId.mockResolvedValue(null);

            await expect(
                service.changePlan('tenant-123', PLAN_CODES.BASIC, {
                    tenantId: 'tenant-123',
                    userId: 'user-123',
                })
            ).rejects.toThrow();
        });

        it('should throw if target plan not found', async () => {
            mockRepository.getByTenantId.mockResolvedValue(mockSubscription);
            mockRepository.getPlanByCode.mockResolvedValue(null);

            await expect(
                service.changePlan('tenant-123', 'INVALID', {
                    tenantId: 'tenant-123',
                    userId: 'user-123',
                })
            ).rejects.toThrow();
        });

        it('should throw if target plan is inactive', async () => {
            mockRepository.getByTenantId.mockResolvedValue(mockSubscription);
            mockRepository.getPlanByCode.mockResolvedValue({ ...mockBasicPlan, isActive: false });

            await expect(
                service.changePlan('tenant-123', PLAN_CODES.BASIC, {
                    tenantId: 'tenant-123',
                    userId: 'user-123',
                })
            ).rejects.toThrow();
        });
    });

    describe('isSubscriptionActive', () => {
        it('should return true for trialing subscription', async () => {
            mockRepository.getByTenantId.mockResolvedValue(mockSubscription);

            const result = await service.isSubscriptionActive('tenant-123');

            expect(result).toBe(true);
        });

        it('should return true for active subscription', async () => {
            mockRepository.getByTenantId.mockResolvedValue({
                ...mockSubscription,
                status: SUBSCRIPTION_STATUS.ACTIVE,
            });

            const result = await service.isSubscriptionActive('tenant-123');

            expect(result).toBe(true);
        });

        it('should return false for past_due subscription', async () => {
            mockRepository.getByTenantId.mockResolvedValue({
                ...mockSubscription,
                status: SUBSCRIPTION_STATUS.PAST_DUE,
            });

            const result = await service.isSubscriptionActive('tenant-123');

            expect(result).toBe(false);
        });

        it('should return false if no subscription', async () => {
            mockRepository.getByTenantId.mockResolvedValue(null);

            const result = await service.isSubscriptionActive('tenant-123');

            expect(result).toBe(false);
        });
    });

    describe('processTrialExpiry', () => {
        it('should mark expired trials as past_due', async () => {
            const expiredTrials = [
                { id: 'sub-1', tenantId: 'tenant-1' },
                { id: 'sub-2', tenantId: 'tenant-2' },
            ];
            mockRepository.getExpiredTrials.mockResolvedValue(expiredTrials);
            mockRepository.markTrialsExpired.mockResolvedValue(2);

            const count = await service.processTrialExpiry();

            expect(count).toBe(2);
            expect(mockRepository.markTrialsExpired).toHaveBeenCalledWith(['sub-1', 'sub-2']);
        });

        it('should return 0 if no expired trials', async () => {
            mockRepository.getExpiredTrials.mockResolvedValue([]);

            const count = await service.processTrialExpiry();

            expect(count).toBe(0);
            expect(mockRepository.markTrialsExpired).not.toHaveBeenCalled();
        });
    });
});
