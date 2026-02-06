/**
 * Rate Limit Service
 * Core rate limiting logic with multi-dimensional checks
 */
import { RATE_LIMIT_SCOPE } from './rate-limit.constants';
import { getResolvedRateLimitConfig } from './rate-limit.config';
import { incrementCounter, isRedisConnected } from './rate-limit.redis';
import {
    buildRateLimitKey,
    calculateResetTimestamp,
    sanitizeIdentifier,
} from './rate-limit.utils';
import type {
    RateLimitContext,
    RateCheckResult,
    RateLimitConfig,
    RateLimitOverride,
    RateLimitStatusResponse,
    RateLimitViolation,
} from './rate-limit.types';
import { getLogger } from '../../utils/logger';

const logger = getLogger('rate-limit-service');

export class RateLimitService {
    /**
     * Check rate limits for all dimensions (tenant, user, IP)
     * Returns first violated limit or allowed result
     */
    async checkRateLimits(
        context: RateLimitContext,
        override?: RateLimitOverride
    ): Promise<RateCheckResult> {
        // Get resolved config for tenant
        const config = await getResolvedRateLimitConfig(context.tenantId);

        // If rate limiting disabled, allow all
        if (!config.enabled) {
            return this.createAllowedResult(config.tenant.limit, config.tenant.windowSeconds);
        }

        // Apply overrides if provided
        const effectiveConfig = this.applyOverrides(config, override);

        // Check IP-level (always checked, even without auth)
        const ipResult = await this.checkSingleLimit(
            RATE_LIMIT_SCOPE.IP,
            sanitizeIdentifier(context.ip),
            effectiveConfig.ip.limit,
            effectiveConfig.ip.windowSeconds,
            effectiveConfig.blockDurationSeconds
        );
        if (!ipResult.allowed) {
            this.logViolation(context, ipResult);
            return ipResult;
        }

        // Check user-level (if authenticated)
        if (context.userId) {
            const userResult = await this.checkSingleLimit(
                RATE_LIMIT_SCOPE.USER,
                sanitizeIdentifier(context.userId),
                effectiveConfig.user.limit,
                effectiveConfig.user.windowSeconds,
                effectiveConfig.blockDurationSeconds
            );
            if (!userResult.allowed) {
                this.logViolation(context, userResult);
                return userResult;
            }
        }

        // Check tenant-level (if authenticated)
        if (context.tenantId) {
            const tenantResult = await this.checkSingleLimit(
                RATE_LIMIT_SCOPE.TENANT,
                sanitizeIdentifier(context.tenantId),
                effectiveConfig.tenant.limit,
                effectiveConfig.tenant.windowSeconds,
                effectiveConfig.blockDurationSeconds
            );
            if (!tenantResult.allowed) {
                this.logViolation(context, tenantResult);
                return tenantResult;
            }
        }

        // All checks passed
        return ipResult; // Return IP result as it has the most restrictive remaining
    }

    /**
     * Check a single rate limit dimension
     */
    private async checkSingleLimit(
        scope: string,
        identifier: string,
        limit: number,
        windowSeconds: number,
        blockDurationSeconds: number
    ): Promise<RateCheckResult> {
        const key = buildRateLimitKey(scope as 'tenant' | 'user' | 'ip', identifier, windowSeconds);
        const result = await incrementCounter(key, windowSeconds);

        // Redis unavailable - fail open
        if (result === null) {
            return this.createAllowedResult(limit, windowSeconds);
        }

        const { count, ttl } = result;
        const remaining = Math.max(0, limit - count);
        const resetAt = calculateResetTimestamp(windowSeconds);

        if (count > limit) {
            return {
                allowed: false,
                scope: scope as 'tenant' | 'user' | 'ip',
                limit,
                remaining: 0,
                resetAt,
                retryAfterSeconds: Math.min(ttl, blockDurationSeconds),
            };
        }

        return {
            allowed: true,
            scope: scope as 'tenant' | 'user' | 'ip',
            limit,
            remaining,
            resetAt,
        };
    }

    /**
     * Apply route-specific overrides to config
     */
    private applyOverrides(config: RateLimitConfig, override?: RateLimitOverride): RateLimitConfig {
        if (!override) return config;

        return {
            ...config,
            tenant: override.tenant?.perMinute
                ? { limit: override.tenant.perMinute, windowSeconds: 60 }
                : config.tenant,
            user: override.user?.perMinute
                ? { limit: override.user.perMinute, windowSeconds: 60 }
                : config.user,
            ip: override.ip?.perMinute
                ? { limit: override.ip.perMinute, windowSeconds: 60 }
                : config.ip,
        };
    }

    /**
     * Create an "allowed" result
     */
    private createAllowedResult(limit: number, windowSeconds: number): RateCheckResult {
        return {
            allowed: true,
            scope: 'ip',
            limit,
            remaining: limit - 1,
            resetAt: calculateResetTimestamp(windowSeconds),
        };
    }

    /**
     * Log rate limit violation to audit
     */
    private logViolation(context: RateLimitContext, result: RateCheckResult): void {
        const violation: RateLimitViolation = {
            tenantId: context.tenantId,
            userId: context.userId,
            ip: context.ip,
            endpoint: context.endpoint,
            method: context.method,
            scope: result.scope,
            limit: result.limit,
            timestamp: new Date(),
        };

        logger.warn('Rate limit exceeded', violation);

        // TODO: Write to AuditLog table
        // auditService.logRateLimitViolation(violation);
    }

    /**
     * Get rate limit status (for admin endpoint)
     */
    async getStatus(tenantId?: string, branchId?: string): Promise<RateLimitStatusResponse> {
        const config = await getResolvedRateLimitConfig(tenantId, branchId);
        const redisConnected = await isRedisConnected();

        return {
            enabled: config.enabled,
            redisConnected,
            resolvedLimits: {
                tenant: config.tenant,
                user: config.user,
                ip: config.ip,
            },
            blockDurationSeconds: config.blockDurationSeconds,
        };
    }
}

export const rateLimitService = new RateLimitService();
