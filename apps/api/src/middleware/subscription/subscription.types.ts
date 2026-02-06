/**
 * Subscription Enforcement Types
 */

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled';

export interface SubscriptionContext {
    tenantId: string;
    planCode: string;
    status: SubscriptionStatus;
}

export interface EnforcementContext {
    tenantId?: string;
    userId?: string;
    branchId?: string;
    featureKey?: string;
    limitKey?: string;
    currentCount?: number;
}

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            subscriptionContext?: SubscriptionContext;
            enforcementContext?: EnforcementContext;
        }
    }
}
