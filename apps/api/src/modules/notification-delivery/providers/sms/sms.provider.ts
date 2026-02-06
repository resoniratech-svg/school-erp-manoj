/**
 * SMS Provider Interface
 */
import type { IDeliveryProvider, ProviderSendResult } from '../../notification-delivery.types';

export interface SmsPayload {
    message: string;
    templateId?: string;
    variables?: Record<string, string>;
}

export abstract class SmsProvider implements IDeliveryProvider {
    abstract name: string;
    abstract send(target: string, payload: Record<string, unknown>): Promise<ProviderSendResult>;
}
