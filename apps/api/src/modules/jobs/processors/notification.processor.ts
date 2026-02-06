/**
 * Notification Delivery Processor
 * Processes notification.delivery jobs
 */
import type { JobPayload, IJobProcessor } from '../jobs.types';
import { deliveryService } from '../../notification-delivery';
import { getLogger } from '../../../utils/logger';

const logger = getLogger('notification-processor');

export class NotificationProcessor implements IJobProcessor {
    /**
     * Process notification delivery job
     */
    async process(job: JobPayload): Promise<Record<string, unknown>> {
        logger.info(`Processing notification: ${job.jobId}`);

        const { notificationId, channel, target, payload } = job.payload as {
            notificationId: string;
            channel: 'email' | 'sms' | 'whatsapp';
            target: string;
            payload: Record<string, unknown>;
        };

        // Dispatch via delivery service
        const result = await deliveryService.dispatch(
            {
                notificationId,
                channel,
                target,
                payload,
            },
            {
                tenantId: job.tenantId,
                branchId: job.branchId,
                userId: job.triggeredBy || 'system',
            }
        );

        return {
            deliveryId: result.id,
            status: result.status,
        };
    }
}

export const notificationProcessor = new NotificationProcessor();
