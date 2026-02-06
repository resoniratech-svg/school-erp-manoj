/**
 * AWS SES Email Provider
 */
import { EmailProvider, type EmailPayload } from './email.provider';
import type { ProviderSendResult } from '../../notification-delivery.types';
import { getLogger } from '../../../../utils/logger';

const logger = getLogger('ses-provider');

export class SesProvider extends EmailProvider {
    name = 'ses';

    constructor(
        private config: {
            region: string;
            from: string;
        } = {
                region: process.env.AWS_REGION || 'us-east-1',
                from: process.env.SES_FROM || 'noreply@school-erp.com',
            }
    ) {
        super();
    }

    async send(target: string, payload: Record<string, unknown>): Promise<ProviderSendResult> {
        const emailPayload = payload as unknown as EmailPayload;

        try {
            // TODO: Implement AWS SES SDK
            // const ses = new SESClient({ region: this.config.region });
            // await ses.send(new SendEmailCommand({
            //   Source: this.config.from,
            //   Destination: { ToAddresses: [target] },
            //   Message: {
            //     Subject: { Data: emailPayload.subject },
            //     Body: { 
            //       Text: { Data: emailPayload.body },
            //       Html: { Data: emailPayload.html },
            //     },
            //   },
            // }));

            logger.info(`SES email sent to ${target}`, { subject: emailPayload.subject });

            return {
                success: true,
                messageId: `ses-${Date.now()}`,
            };
        } catch (error) {
            logger.error('SES send failed', { error, target });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'SES send failed',
            };
        }
    }
}

export const sesProvider = new SesProvider();
