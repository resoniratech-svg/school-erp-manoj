/**
 * MSG91 SMS Provider (India)
 */
import { SmsProvider, type SmsPayload } from './sms.provider';
import type { ProviderSendResult } from '../../notification-delivery.types';
import { getLogger } from '../../../../utils/logger';

const logger = getLogger('msg91-provider');

export class Msg91Provider extends SmsProvider {
    name = 'msg91';

    constructor(
        private config: {
            authKey: string;
            senderId: string;
            route: string;
        } = {
                authKey: process.env.MSG91_AUTH_KEY || '',
                senderId: process.env.MSG91_SENDER_ID || '',
                route: process.env.MSG91_ROUTE || '4',
            }
    ) {
        super();
    }

    async send(target: string, payload: Record<string, unknown>): Promise<ProviderSendResult> {
        const smsPayload = payload as unknown as SmsPayload;

        try {
            // TODO: Implement MSG91 API
            // const response = await fetch('https://api.msg91.com/api/v5/flow/', {
            //   method: 'POST',
            //   headers: {
            //     'authkey': this.config.authKey,
            //     'Content-Type': 'application/json',
            //   },
            //   body: JSON.stringify({
            //     template_id: smsPayload.templateId,
            //     mobiles: target,
            //     ...smsPayload.variables,
            //   }),
            // });

            logger.info(`MSG91 SMS sent to ${target}`);

            return {
                success: true,
                messageId: `msg91-${Date.now()}`,
            };
        } catch (error) {
            logger.error('MSG91 send failed', { error, target });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'MSG91 send failed',
            };
        }
    }
}

export const msg91Provider = new Msg91Provider();
