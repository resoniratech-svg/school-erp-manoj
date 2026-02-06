/**
 * Subscription Module Types
 */

export interface PlanResponse {
    id: string;
    code: string;
    name: string;
    description: string | null;
    priceMonthly: number;
    priceDisplay: string;
    isActive: boolean;
    isPublic: boolean;
    displayOrder: number;
}

export interface SubscriptionResponse {
    id: string;
    tenantId: string;
    plan: PlanResponse;
    status: string;
    trialEndsAt: string | null;
    trialDaysRemaining: number | null;
    startedAt: string;
    endsAt: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SubscriptionContext {
    tenantId: string;
    userId: string;
    branchId?: string;
}

export interface CreateTrialInput {
    tenantId: string;
}

export interface ChangePlanInput {
    planCode: string;
}
