/**
 * Subscription API Client
 * Typed client for subscription management
 */
import { apiClient } from '../core/axios';
import type { ApiResponse } from '../types/api-response';

// Types
export interface Plan {
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

export interface Subscription {
    id: string;
    tenantId: string;
    plan: Plan;
    status: 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled';
    trialEndsAt: string | null;
    trialDaysRemaining: number | null;
    startedAt: string;
    endsAt: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ChangePlanInput {
    planCode: string;
}

const BASE_URL = '/subscription';

export const subscriptionClient = {
    /**
     * Get current tenant subscription
     */
    getCurrent: async (): Promise<Subscription> => {
        const response = await apiClient.get<ApiResponse<Subscription>>(`${BASE_URL}/current`);
        return response.data.data;
    },

    /**
     * List available subscription plans
     */
    listPlans: async (): Promise<Plan[]> => {
        const response = await apiClient.get<ApiResponse<Plan[]>>(`${BASE_URL}/plans`);
        return response.data.data;
    },

    /**
     * Change subscription plan
     */
    changePlan: async (planCode: string): Promise<Subscription> => {
        const response = await apiClient.post<ApiResponse<Subscription>>(`${BASE_URL}/change-plan`, { planCode });
        return response.data.data;
    },
};
