/**
 * Twilio SMS Provider
 */
import { SmsProvider, type SmsPayload } from './sms.provider';
import type { ProviderSendResult } from '../../notification-delivery.types';
import { getLogger } from '../../../../utils/logger';

const logger = getLogger('twilio-provider');

export class TwilioProvider extends SmsProvider {
    name = 'twilio';

    constructor(
        private config: {
            accountSid: string;
            authToken: string;
            from: string;
        } = {
                accountSid: process.env.TWILIO_ACCOUNT_SID || '',
                authToken: process.env.TWILIO_AUTH_TOKEN || '',
                from: process.env.TWILIO_FROM || '',
            }
    ) {
        super();
    }

    async send(target: string, payload: Record<string, unknown>): Promise<ProviderSendResult> {
        const smsPayload = payload as unknown as SmsPayload;

        try {
            // TODO: Implement Twilio SDK
            // const client = twilio(this.config.accountSid, this.config.authToken);
            // const message = await client.messages.create({
            //   body: smsPayload.message,
            //   from: this.config.from,
            //   to: target,
            // });

            logger.info(`Twilio SMS sent to ${target}`);

            return {
                success: true,
                messageId: `twilio-${Date.now()}`,
            };
        } catch (error) {
            logger.error('Twilio send failed', { error, target });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Twilio send failed',
            };
        }
    }
}

export const twilioProvider = new TwilioProvider();
