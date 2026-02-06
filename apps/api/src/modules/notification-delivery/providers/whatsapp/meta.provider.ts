/**
 * Meta WhatsApp Business API Provider
 */
import { WhatsAppProvider, type WhatsAppPayload } from './whatsapp.provider';
import type { ProviderSendResult } from '../../notification-delivery.types';
import { getLogger } from '../../../../utils/logger';

const logger = getLogger('meta-whatsapp-provider');

export class MetaWhatsAppProvider extends WhatsAppProvider {
    name = 'meta';

    constructor(
        private config: {
            accessToken: string;
            phoneNumberId: string;
        } = {
                accessToken: process.env.META_WHATSAPP_TOKEN || '',
                phoneNumberId: process.env.META_WHATSAPP_PHONE_ID || '',
            }
    ) {
        super();
    }

    async send(target: string, payload: Record<string, unknown>): Promise<ProviderSendResult> {
        const waPayload = payload as unknown as WhatsAppPayload;

        try {
            // TODO: Implement Meta WhatsApp Business API
            // const response = await fetch(
            //   `https://graph.facebook.com/v18.0/${this.config.phoneNumberId}/messages`,
            //   {
            //     method: 'POST',
            //     headers: {
            //       'Authorization': `Bearer ${this.config.accessToken}`,
            //       'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({
            //       messaging_product: 'whatsapp',
            //       to: target,
            //       type: 'template',
            //       template: {
            //         name: waPayload.templateName,
            //         language: { code: waPayload.templateLanguage },
            //         components: waPayload.variables ? [{
            //           type: 'body',
            //           parameters: Object.values(waPayload.variables).map(v => ({
            //             type: 'text',
            //             text: v,
            //           })),
            //         }] : [],
            //       },
            //     }),
            //   }
            // );

            logger.info(`Meta WhatsApp sent to ${target}`, { template: waPayload.templateName });

            return {
                success: true,
                messageId: `meta-wa-${Date.now()}`,
            };
        } catch (error) {
            logger.error('Meta WhatsApp send failed', { error, target });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Meta WhatsApp send failed',
            };
        }
    }
}

export const metaWhatsAppProvider = new MetaWhatsAppProvider();
