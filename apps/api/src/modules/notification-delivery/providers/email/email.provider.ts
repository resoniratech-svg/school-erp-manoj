/**
 * Email Provider Interface
 */
import type { IDeliveryProvider, ProviderSendResult } from '../../notification-delivery.types';

export interface EmailPayload {
    to: string;
    subject: string;
    body: string;
    html?: string;
    from?: string;
    replyTo?: string;
}

export abstract class EmailProvider implements IDeliveryProvider {
    abstract name: string;
    abstract send(target: string, payload: Record<string, unknown>): Promise<ProviderSendResult>;
}
