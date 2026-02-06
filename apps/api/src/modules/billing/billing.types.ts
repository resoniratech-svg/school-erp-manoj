/**
 * Billing Module Types
 */

export interface CreateOrderInput {
    planCode: string;
}

export interface CreateOrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    key: string;
    planCode: string;
    planName: string;
}

export interface PaymentResponse {
    id: string;
    tenantId: string;
    subscriptionId: string;
    provider: string;
    providerOrderId: string;
    providerPaymentId: string | null;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
}

export interface BillingContext {
    tenantId: string;
    userId: string;
    branchId?: string;
}

export interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    created_at: number;
}

export interface RazorpayWebhookPayload {
    entity: string;
    account_id: string;
    event: string;
    contains: string[];
    payload: {
        payment?: {
            entity: {
                id: string;
                order_id: string;
                amount: number;
                currency: string;
                status: string;
                method: string;
                captured: boolean;
                description: string;
                notes: Record<string, string>;
                error_code?: string;
                error_description?: string;
            };
        };
    };
    created_at: number;
}
