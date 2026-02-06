/**
 * Rate Limit Config Key Mappings
 * Integrates with Module 16 (System Config)
 */
import { configService } from '../config';
import { DEFAULT_LIMITS, WINDOW_SIZE } from './rate-limit.constants';
import type { RateLimitConfig, LimitDefinition } from './rate-limit.types';

// Config keys for rate limiting
export const RATE_LIMIT_CONFIG_KEYS = {
    ENABLED: 'rate.limit.enabled',
    TENANT_PER_MINUTE: 'rate.limit.tenant.perMinute',
    USER_PER_MINUTE: 'rate.limit.user.perMinute',
    IP_PER_MINUTE: 'rate.limit.ip.perMinute',
    AUTH_LOGIN_PER_MINUTE: 'rate.limit.auth.login.perMinute',
    AUTH_PASSWORD_RESET_PER_HOUR: 'rate.limit.auth.passwordReset.perHour',
    BLOCK_DURATION_SECONDS: 'rate.limit.blockDurationSeconds',
} as const;

/**
 * Get resolved rate limit config for a tenant/branch
 * Uses Module 16 resolution: branchOverride ?? tenantValue ?? default
 */
export async function getResolvedRateLimitConfig(
    tenantId?: string,
    branchId?: string
): Promise<RateLimitConfig> {
    // If no tenantId, return defaults
    if (!tenantId) {
        return getDefaultConfig();
    }

    try {
        const context = { tenantId, branchId, userId: 'system' };

        // Fetch configs in parallel
        const [
            enabledConfig,
            tenantLimitConfig,
            userLimitConfig,
            ipLimitConfig,
            blockDurationConfig,
        ] = await Promise.all([
            configService.getConfigByKey(RATE_LIMIT_CONFIG_KEYS.ENABLED, context).catch(() => null),
            configService.getConfigByKey(RATE_LIMIT_CONFIG_KEYS.TENANT_PER_MINUTE, context).catch(() => null),
            configService.getConfigByKey(RATE_LIMIT_CONFIG_KEYS.USER_PER_MINUTE, context).catch(() => null),
            configService.getConfigByKey(RATE_LIMIT_CONFIG_KEYS.IP_PER_MINUTE, context).catch(() => null),
            configService.getConfigByKey(RATE_LIMIT_CONFIG_KEYS.BLOCK_DURATION_SECONDS, context).catch(() => null),
        ]);

        return {
            enabled: enabledConfig?.value !== false,
            tenant: {
                limit: (tenantLimitConfig?.value as number) ?? DEFAULT_LIMITS.TENANT_PER_MINUTE,
                windowSeconds: WINDOW_SIZE.MINUTE,
            },
            user: {
                limit: (userLimitConfig?.value as number) ?? DEFAULT_LIMITS.USER_PER_MINUTE,
                windowSeconds: WINDOW_SIZE.MINUTE,
            },
            ip: {
                limit: (ipLimitConfig?.value as number) ?? DEFAULT_LIMITS.IP_PER_MINUTE,
                windowSeconds: WINDOW_SIZE.MINUTE,
            },
            blockDurationSeconds: (blockDurationConfig?.value as number) ?? DEFAULT_LIMITS.BLOCK_DURATION_SECONDS,
        };
    } catch {
        // Config service unavailable, use defaults
        return getDefaultConfig();
    }
}

/**
 * Get auth-specific limits for login/password reset
 */
export async function getAuthRateLimits(
    tenantId?: string,
    branchId?: string
): Promise<{ login: LimitDefinition; passwordReset: LimitDefinition }> {
    if (!tenantId) {
        return {
            login: { limit: DEFAULT_LIMITS.AUTH_LOGIN_PER_MINUTE, windowSeconds: WINDOW_SIZE.MINUTE },
            passwordReset: { limit: DEFAULT_LIMITS.AUTH_PASSWORD_RESET_PER_HOUR, windowSeconds: WINDOW_SIZE.HOUR },
        };
    }

    try {
        const context = { tenantId, branchId, userId: 'system' };

        const [loginConfig, passwordResetConfig] = await Promise.all([
            configService.getConfigByKey(RATE_LIMIT_CONFIG_KEYS.AUTH_LOGIN_PER_MINUTE, context).catch(() => null),
            configService.getConfigByKey(RATE_LIMIT_CONFIG_KEYS.AUTH_PASSWORD_RESET_PER_HOUR, context).catch(() => null),
        ]);

        return {
            login: {
                limit: (loginConfig?.value as number) ?? DEFAULT_LIMITS.AUTH_LOGIN_PER_MINUTE,
                windowSeconds: WINDOW_SIZE.MINUTE,
            },
            passwordReset: {
                limit: (passwordResetConfig?.value as number) ?? DEFAULT_LIMITS.AUTH_PASSWORD_RESET_PER_HOUR,
                windowSeconds: WINDOW_SIZE.HOUR,
            },
        };
    } catch {
        return {
            login: { limit: DEFAULT_LIMITS.AUTH_LOGIN_PER_MINUTE, windowSeconds: WINDOW_SIZE.MINUTE },
            passwordReset: { limit: DEFAULT_LIMITS.AUTH_PASSWORD_RESET_PER_HOUR, windowSeconds: WINDOW_SIZE.HOUR },
        };
    }
}

/**
 * Get default config (when config service unavailable)
 */
function getDefaultConfig(): RateLimitConfig {
    return {
        enabled: true,
        tenant: { limit: DEFAULT_LIMITS.TENANT_PER_MINUTE, windowSeconds: WINDOW_SIZE.MINUTE },
        user: { limit: DEFAULT_LIMITS.USER_PER_MINUTE, windowSeconds: WINDOW_SIZE.MINUTE },
        ip: { limit: DEFAULT_LIMITS.IP_PER_MINUTE, windowSeconds: WINDOW_SIZE.MINUTE },
        blockDurationSeconds: DEFAULT_LIMITS.BLOCK_DURATION_SECONDS,
    };
}
