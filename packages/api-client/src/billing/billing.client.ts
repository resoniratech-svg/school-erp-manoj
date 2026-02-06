/**
 * Billing API Client
 * Create orders for Razorpay payment
 */
import { apiClient } from '../core/axios';
import type { ApiResponse } from '../types/api-response';

// Types
export interface CreateOrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    key: string;
    planCode: string;
    planName: string;
}

export interface PaymentRecord {
    id: string;
    tenantId: string;
    subscriptionId: string;
    provider: string;
    providerOrderId: string;
    providerPaymentId: string | null;
    amount: number;
    currency: string;
    status: 'created' | 'paid' | 'failed' | 'refunded';
    createdAt: string;
}

const BASE_URL = '/billing';

export const billingClient = {
    /**
     * Create Razorpay order for plan upgrade
     */
    createOrder: async (planCode: string): Promise<CreateOrderResponse> => {
        const response = await apiClient.post<ApiResponse<CreateOrderResponse>>(
            `${BASE_URL}/create-order`,
            { planCode }
        );
        return response.data.data;
    },

    /**
     * Get payment history
     */
    getPayments: async (): Promise<PaymentRecord[]> => {
        const response = await apiClient.get<ApiResponse<PaymentRecord[]>>(
            `${BASE_URL}/payments`
        );
        return response.data.data;
    },
};
