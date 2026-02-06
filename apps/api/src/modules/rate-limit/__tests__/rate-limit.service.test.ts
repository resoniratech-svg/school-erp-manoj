/**
 * Rate Limit Service Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { RateLimitService } from '../rate-limit.service';
import * as redisModule from '../rate-limit.redis';
import * as configModule from '../rate-limit.config';
import { RATE_LIMIT_SCOPE } from '../rate-limit.constants';

// Mock Redis module
vi.mock('../rate-limit.redis', () => ({
    incrementCounter: vi.fn(),
    isRedisConnected: vi.fn(),
}));

// Mock config module
vi.mock('../rate-limit.config', () => ({
    getResolvedRateLimitConfig: vi.fn(),
}));

describe('RateLimitService', () => {
    let service: RateLimitService;

    const mockContext = {
        tenantId: 'tenant-123',
        userId: 'user-456',
        ip: '192.168.1.1',
        endpoint: '/api/v1/users',
        method: 'GET',
    };

    const mockConfig = {
        enabled: true,
        tenant: { limit: 1000, windowSeconds: 60 },
        user: { limit: 100, windowSeconds: 60 },
        ip: { limit: 60, windowSeconds: 60 },
        blockDurationSeconds: 60,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        service = new RateLimitService();
        (configModule.getResolvedRateLimitConfig as Mock).mockResolvedValue(mockConfig);
    });

    describe('allow under limit', () => {
        it('should allow requests under limit', async () => {
            (redisModule.incrementCounter as Mock).mockResolvedValue({ count: 1, ttl: 60 });

            const result = await service.checkRateLimits(mockContext);

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBeGreaterThan(0);
        });
    });

    describe('block over limit', () => {
        it('should block requests over IP limit', async () => {
            (redisModule.incrementCounter as Mock).mockResolvedValue({ count: 61, ttl: 45 });

            const result = await service.checkRateLimits(mockContext);

            expect(result.allowed).toBe(false);
            expect(result.scope).toBe(RATE_LIMIT_SCOPE.IP);
            expect(result.retryAfterSeconds).toBe(45);
        });

        it('should block requests over user limit', async () => {
            // IP passes, user fails
            (redisModule.incrementCounter as Mock)
                .mockResolvedValueOnce({ count: 1, ttl: 60 }) // IP pass
                .mockResolvedValueOnce({ count: 101, ttl: 30 }); // User fail

            const result = await service.checkRateLimits(mockContext);

            expect(result.allowed).toBe(false);
            expect(result.scope).toBe(RATE_LIMIT_SCOPE.USER);
        });

        it('should block requests over tenant limit', async () => {
            // IP and user pass, tenant fails
            (redisModule.incrementCounter as Mock)
                .mockResolvedValueOnce({ count: 1, ttl: 60 }) // IP pass
                .mockResolvedValueOnce({ count: 1, ttl: 60 }) // User pass
                .mockResolvedValueOnce({ count: 1001, ttl: 20 }); // Tenant fail

            const result = await service.checkRateLimits(mockContext);

            expect(result.allowed).toBe(false);
            expect(result.scope).toBe(RATE_LIMIT_SCOPE.TENANT);
        });
    });

    describe('reset after window', () => {
        it('should include correct reset timestamp', async () => {
            (redisModule.incrementCounter as Mock).mockResolvedValue({ count: 1, ttl: 60 });

            const result = await service.checkRateLimits(mockContext);

            expect(result.resetAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
        });
    });

    describe('branch override precedence', () => {
        it('should use override when provided', async () => {
            (redisModule.incrementCounter as Mock).mockResolvedValue({ count: 6, ttl: 60 });

            const result = await service.checkRateLimits(mockContext, {
                ip: { perMinute: 5 }, // Override to strict limit
            });

            expect(result.allowed).toBe(false); // 6 > 5
        });
    });

    describe('config disabled bypass', () => {
        it('should allow all when rate limiting disabled', async () => {
            (configModule.getResolvedRateLimitConfig as Mock).mockResolvedValue({
                ...mockConfig,
                enabled: false,
            });

            const result = await service.checkRateLimits(mockContext);

            expect(result.allowed).toBe(true);
            expect(redisModule.incrementCounter).not.toHaveBeenCalled();
        });
    });

    describe('Redis failure fallback', () => {
        it('should fail open when Redis unavailable', async () => {
            (redisModule.incrementCounter as Mock).mockResolvedValue(null);

            const result = await service.checkRateLimits(mockContext);

            expect(result.allowed).toBe(true); // Fail open
        });
    });

    describe('getStatus', () => {
        it('should return current status', async () => {
            (redisModule.isRedisConnected as Mock).mockResolvedValue(true);

            const status = await service.getStatus('tenant-123');

            expect(status.enabled).toBe(true);
            expect(status.redisConnected).toBe(true);
            expect(status.resolvedLimits.ip.limit).toBe(60);
        });
    });
});
