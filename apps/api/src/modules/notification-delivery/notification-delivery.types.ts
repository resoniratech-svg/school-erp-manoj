/**
 * Notification Delivery Types
 */

// Channel Type
export type DeliveryChannel = 'email' | 'sms' | 'whatsapp';

// Status Type
export type DeliveryStatus = 'pending' | 'sent' | 'failed';

// Provider Types
export type EmailProvider = 'smtp' | 'ses';
export type SmsProvider = 'twilio' | 'msg91';
export type WhatsAppProvider = 'meta';

// Delivery Record (database representation)
export interface DeliveryRecord {
    id: string;
    notificationId: string;
    channel: DeliveryChannel;
    provider: string;
    target: string; // email address, phone number
    payloadHash: string;
    status: DeliveryStatus;
    failureReason: string | null;
    retryCount: number;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}

// Delivery Response (API)
export interface DeliveryResponse {
    id: string;
    notificationId: string;
    channel: DeliveryChannel;
    provider: string;
    target: string;
    status: DeliveryStatus;
    failureReason: string | null;
    retryCount: number;
    createdAt: Date;
}

// Delivery List Response
export interface DeliveryListResponse {
    deliveries: DeliveryResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

// Dispatch Input
export interface DispatchInput {
    notificationId: string;
    channel: DeliveryChannel;
    target: string;
    payload: Record<string, unknown>;
}

// Provider Send Result
export interface ProviderSendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

// Provider Interface
export interface IDeliveryProvider {
    name: string;
    send(target: string, payload: Record<string, unknown>): Promise<ProviderSendResult>;
}

// Context
export interface DeliveryContext {
    tenantId: string;
    branchId?: string;
    userId: string;
}

// Config
export interface DeliveryConfig {
    emailProvider: EmailProvider;
    smsProvider: SmsProvider;
    whatsappProvider: WhatsAppProvider;
    emailEnabled: boolean;
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    maxRetryCount: number;
}
