/**
 * Rate Limiting Types
 */

// Rate Limit Scope Type
export type RateLimitScope = 'tenant' | 'user' | 'ip';

// Rate Limit Context
export interface RateLimitContext {
    tenantId?: string;
    userId?: string;
    ip: string;
    endpoint: string;
    method: string;
}

// Limit Definition
export interface LimitDefinition {
    limit: number;
    windowSeconds: number;
}

// Rate Limit Config
export interface RateLimitConfig {
    tenant: LimitDefinition;
    user: LimitDefinition;
    ip: LimitDefinition;
    enabled: boolean;
    blockDurationSeconds: number;
}

// Rate Check Result
export interface RateCheckResult {
    allowed: boolean;
    scope: RateLimitScope;
    limit: number;
    remaining: number;
    resetAt: number; // Unix timestamp
    retryAfterSeconds?: number;
}

// Rate Limit Override (for route-specific limits)
export interface RateLimitOverride {
    user?: { perMinute?: number };
    ip?: { perMinute?: number };
    tenant?: { perMinute?: number };
}

// Rate Limit Status Response
export interface RateLimitStatusResponse {
    enabled: boolean;
    redisConnected: boolean;
    resolvedLimits: {
        tenant: LimitDefinition;
        user: LimitDefinition;
        ip: LimitDefinition;
    };
    blockDurationSeconds: number;
}

// Violation Log Entry
export interface RateLimitViolation {
    tenantId?: string;
    userId?: string;
    ip: string;
    endpoint: string;
    method: string;
    scope: RateLimitScope;
    limit: number;
    timestamp: Date;
}
