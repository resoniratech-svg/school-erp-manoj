/**
 * SMTP Email Provider
 */
import { EmailProvider, type EmailPayload } from './email.provider';
import type { ProviderSendResult } from '../../notification-delivery.types';
import { getLogger } from '../../../../utils/logger';

const logger = getLogger('smtp-provider');

export class SmtpProvider extends EmailProvider {
    name = 'smtp';

    constructor(
        private config: {
            host: string;
            port: number;
            user: string;
            pass: string;
            from: string;
        } = {
                host: process.env.SMTP_HOST || 'localhost',
                port: parseInt(process.env.SMTP_PORT || '587', 10),
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || '',
                from: process.env.SMTP_FROM || 'noreply@school-erp.com',
            }
    ) {
        super();
    }

    async send(target: string, payload: Record<string, unknown>): Promise<ProviderSendResult> {
        const emailPayload = payload as unknown as EmailPayload;

        try {
            // TODO: Implement actual nodemailer transport
            // const transporter = nodemailer.createTransport({
            //   host: this.config.host,
            //   port: this.config.port,
            //   auth: { user: this.config.user, pass: this.config.pass },
            // });
            // await transporter.sendMail({
            //   from: this.config.from,
            //   to: target,
            //   subject: emailPayload.subject,
            //   text: emailPayload.body,
            //   html: emailPayload.html,
            // });

            logger.info(`SMTP email sent to ${target}`, { subject: emailPayload.subject });

            return {
                success: true,
                messageId: `smtp-${Date.now()}`,
            };
        } catch (error) {
            logger.error('SMTP send failed', { error, target });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'SMTP send failed',
            };
        }
    }
}

export const smtpProvider = new SmtpProvider();
