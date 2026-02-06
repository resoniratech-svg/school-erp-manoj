/**
 * Subscription Enforcement Middleware Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { subscriptionEnforcementMiddleware } from '../subscription.middleware';
import { ENFORCEMENT_ERROR_CODES } from '../subscription.constants';

// Mock services
vi.mock('../../../modules/subscription/subscription.service', () => ({
    subscriptionService: {
        getCurrentSubscription: vi.fn(),
    },
}));

vi.mock('../../../modules/config/config.service', () => ({
    configService: {
        isFeatureEnabled: vi.fn(),
        getLimit: vi.fn(),
    },
}));

import { subscriptionService } from '../../../modules/subscription/subscription.service';
import { configService } from '../../../modules/config/config.service';

describe('Subscription Enforcement Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let nextFn: NextFunction;

    const mockActiveSubscription = {
        plan: { code: 'BASIC' },
        status: 'active',
    };

    const mockTrialingSubscription = {
        plan: { code: 'FREE' },
        status: 'trialing',
    };

    const mockPastDueSubscription = {
        plan: { code: 'BASIC' },
        status: 'past_due',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockReq = {
            path: '/api/v1/students',
            method: 'GET',
            user: { tenantId: 'tenant-123', id: 'user-123' },
        } as Partial<Request> & { user?: { tenantId: string; id: string } };
        mockRes = {};
        nextFn = vi.fn();
    });

    describe('Subscription Status Gate', () => {
        it('should allow trialing tenant', async () => {
            (subscriptionService.getCurrentSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockTrialingSubscription
            );
            (configService.isFeatureEnabled as ReturnType<typeof vi.fn>).mockResolvedValue(true);

            await subscriptionEnforcementMiddleware(
                mockReq as Request,
                mockRes as Response,
                nextFn
            );

            expect(nextFn).toHaveBeenCalledWith();
        });

        it('should allow active tenant', async () => {
            (subscriptionService.getCurrentSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockActiveSubscription
            );
            (configService.isFeatureEnabled as ReturnType<typeof vi.fn>).mockResolvedValue(true);

            await subscriptionEnforcementMiddleware(
                mockReq as Request,
                mockRes as Response,
                nextFn
            );

            expect(nextFn).toHaveBeenCalledWith();
        });

        it('should block past_due tenant for regular routes', async () => {
            (subscriptionService.getCurrentSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockPastDueSubscription
            );

            await subscriptionEnforcementMiddleware(
                mockReq as Request,
                mockRes as Response,
                nextFn
            );

            expect(nextFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: ENFORCEMENT_ERROR_CODES.SUBSCRIPTION_INACTIVE,
                })
            );
        });

        it('should allow past_due tenant for billing routes', async () => {
            mockReq.path = '/api/v1/billing/create-order';
            (subscriptionService.getCurrentSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockPastDueSubscription
            );

            await subscriptionEnforcementMiddleware(
                mockReq as Request,
                mockRes as Response,
                nextFn
            );

            expect(nextFn).toHaveBeenCalledWith();
        });

        it('should allow past_due tenant for auth routes', async () => {
            mockReq.path = '/api/v1/auth/login';
            (subscriptionService.getCurrentSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockPastDueSubscription
            );

            await subscriptionEnforcementMiddleware(
                mockReq as Request,
                mockRes as Response,
                nextFn
            );

            expect(nextFn).toHaveBeenCalledWith();
        });

        it('should block if no subscription found', async () => {
            (subscriptionService.getCurrentSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(null);

            await subscriptionEnforcementMiddleware(
                mockReq as Request,
                mockRes as Response,
                nextFn
            );

            expect(nextFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: ENFORCEMENT_ERROR_CODES.NO_SUBSCRIPTION,
                })
            );
        });
    });

    describe('Feature Flag Gate', () => {
        it('should block if feature is disabled', async () => {
            mockReq.path = '/api/v1/fees/structures';
            (subscriptionService.getCurrentSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockActiveSubscription
            );
            (configService.isFeatureEnabled as ReturnType<typeof vi.fn>).mockResolvedValue(false);

            await subscriptionEnforcementMiddleware(
                mockReq as Request,
                mockRes as Response,
                nextFn
            );

            expect(nextFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: ENFORCEMENT_ERROR_CODES.FEATURE_DISABLED,
                })
            );
        });

        it('should allow if feature is enabled', async () => {
            mockReq.path = '/api/v1/fees/structures';
            (subscriptionService.getCurrentSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockActiveSubscription
            );
            (configService.isFeatureEnabled as ReturnType<typeof vi.fn>).mockResolvedValue(true);

            await subscriptionEnforcementMiddleware(
                mockReq as Request,
                mockRes as Response,
                nextFn
            );

            expect(nextFn).toHaveBeenCalledWith();
        });
    });

    describe('Limit Gate', () => {
        it('should block write if limit exceeded', async () => {
            mockReq.path = '/api/v1/students';
            mockReq.method = 'POST';
            mockReq.enforcementContext = {
                limitKey: 'limits.maxStudents',
                currentCount: 50,
            };
            (subscriptionService.getCurrentSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockActiveSubscription
            );
            (configService.isFeatureEnabled as ReturnType<typeof vi.fn>).mockResolvedValue(true);
            (configService.getLimit as ReturnType<typeof vi.fn>).mockResolvedValue(50);

            await subscriptionEnforcementMiddleware(
                mockReq as Request,
                mockRes as Response,
                nextFn
            );

            expect(nextFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: ENFORCEMENT_ERROR_CODES.PLAN_LIMIT_EXCEEDED,
                })
            );
        });

        it('should allow write if under limit', async () => {
            mockReq.path = '/api/v1/students';
            mockReq.method = 'POST';
            mockReq.enforcementContext = {
                limitKey: 'limits.maxStudents',
                currentCount: 49,
            };
            (subscriptionService.getCurrentSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockActiveSubscription
            );
            (configService.isFeatureEnabled as ReturnType<typeof vi.fn>).mockResolvedValue(true);
            (configService.getLimit as ReturnType<typeof vi.fn>).mockResolvedValue(50);

            await subscriptionEnforcementMiddleware(
                mockReq as Request,
                mockRes as Response,
                nextFn
            );

            expect(nextFn).toHaveBeenCalledWith();
        });

        it('should skip limit check for read operations', async () => {
            mockReq.path = '/api/v1/students';
            mockReq.method = 'GET';
            mockReq.enforcementContext = {
                limitKey: 'limits.maxStudents',
                currentCount: 100,
            };
            (subscriptionService.getCurrentSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(
                mockActiveSubscription
            );
            (configService.isFeatureEnabled as ReturnType<typeof vi.fn>).mockResolvedValue(true);

            await subscriptionEnforcementMiddleware(
                mockReq as Request,
                mockRes as Response,
                nextFn
            );

            // Should pass without checking limit
            expect(nextFn).toHaveBeenCalledWith();
            expect(configService.getLimit).not.toHaveBeenCalled();
        });
    });

    describe('No Tenant Context', () => {
        it('should skip enforcement for public routes', async () => {
            mockReq.user = undefined;

            await subscriptionEnforcementMiddleware(
                mockReq as Request,
                mockRes as Response,
                nextFn
            );

            expect(nextFn).toHaveBeenCalledWith();
            expect(subscriptionService.getCurrentSubscription).not.toHaveBeenCalled();
        });
    });
});
