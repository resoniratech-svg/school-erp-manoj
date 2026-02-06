/**
 * WhatsApp Provider Interface
 */
import type { IDeliveryProvider, ProviderSendResult } from '../../notification-delivery.types';

export interface WhatsAppPayload {
    templateName: string;
    templateLanguage: string;
    variables?: Record<string, string>;
}

export abstract class WhatsAppProvider implements IDeliveryProvider {
    abstract name: string;
    abstract send(target: string, payload: Record<string, unknown>): Promise<ProviderSendResult>;
}
