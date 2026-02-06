/**
 * Rate Limit Middleware Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { rateLimit } from '../rate-limit.middleware';
import { rateLimitService } from '../rate-limit.service';
import { RATE_LIMIT_HEADERS } from '../rate-limit.constants';

// Mock the service
vi.mock('../rate-limit.service', () => ({
    rateLimitService: {
        checkRateLimits: vi.fn(),
    },
}));

describe('Rate Limit Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();

        mockReq = {
            path: '/api/v1/users',
            method: 'GET',
            ip: '192.168.1.1',
            headers: {},
            tenant: { id: 'tenant-123' },
            user: { id: 'user-456' },
            requestId: 'req-789',
        } as unknown as Partial<Request>;

        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
        };

        mockNext = vi.fn();
    });

    describe('tenant + user + IP evaluated', () => {
        it('should pass all dimensions to service', async () => {
            (rateLimitService.checkRateLimits as Mock).mockResolvedValue({
                allowed: true,
                scope: 'ip',
                limit: 60,
                remaining: 59,
                resetAt: Date.now() + 60000,
            });

            const middleware = rateLimit();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(rateLimitService.checkRateLimits).toHaveBeenCalledWith(
                expect.objectContaining({
                    tenantId: 'tenant-123',
                    userId: 'user-456',
                    ip: '192.168.1.1',
                }),
                undefined
            );
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('correct headers returned', () => {
        it('should set rate limit headers on success', async () => {
            (rateLimitService.checkRateLimits as Mock).mockResolvedValue({
                allowed: true,
                scope: 'ip',
                limit: 60,
                remaining: 55,
                resetAt: 1234567890,
            });

            const middleware = rateLimit();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.set).toHaveBeenCalledWith(RATE_LIMIT_HEADERS.LIMIT, '60');
            expect(mockRes.set).toHaveBeenCalledWith(RATE_LIMIT_HEADERS.REMAINING, '55');
            expect(mockRes.set).toHaveBeenCalledWith(RATE_LIMIT_HEADERS.RESET, '1234567890');
        });
    });

    describe('429 response structure', () => {
        it('should return proper 429 response when blocked', async () => {
            (rateLimitService.checkRateLimits as Mock).mockResolvedValue({
                allowed: false,
                scope: 'user',
                limit: 100,
                remaining: 0,
                resetAt: 1234567890,
                retryAfterSeconds: 42,
            });

            const middleware = rateLimit();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(429);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'RATE_LIMIT_EXCEEDED',
                    scope: 'user',
                    retryAfterSeconds: 42,
                })
            );
            expect(mockRes.set).toHaveBeenCalledWith(RATE_LIMIT_HEADERS.RETRY_AFTER, '42');
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('auth-less endpoint support', () => {
        it('should work without tenant/user context', async () => {
            mockReq.tenant = undefined;
            mockReq.user = undefined;

            (rateLimitService.checkRateLimits as Mock).mockResolvedValue({
                allowed: true,
                scope: 'ip',
                limit: 60,
                remaining: 59,
                resetAt: Date.now() + 60000,
            });

            const middleware = rateLimit();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(rateLimitService.checkRateLimits).toHaveBeenCalledWith(
                expect.objectContaining({
                    tenantId: undefined,
                    userId: undefined,
                    ip: '192.168.1.1',
                }),
                undefined
            );
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('health check bypass', () => {
        it('should skip rate limiting for health checks', async () => {
            mockReq.path = '/api/v1/health';

            const middleware = rateLimit();
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(rateLimitService.checkRateLimits).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('route-specific overrides', () => {
        it('should apply custom limits', async () => {
            (rateLimitService.checkRateLimits as Mock).mockResolvedValue({
                allowed: true,
                scope: 'ip',
                limit: 5,
                remaining: 4,
                resetAt: Date.now() + 60000,
            });

            const middleware = rateLimit({ ip: { perMinute: 5 } });
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(rateLimitService.checkRateLimits).toHaveBeenCalledWith(
                expect.anything(),
                { ip: { perMinute: 5 } }
            );
        });
    });
});
