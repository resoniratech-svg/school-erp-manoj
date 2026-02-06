/**
 * Notification Delivery Mapper
 */
import type { DeliveryRecord, DeliveryResponse } from './notification-delivery.types';

type DeliveryDbRecord = {
    id: string;
    notificationId: string;
    channel: string;
    provider: string;
    target: string;
    payloadHash: string;
    status: string;
    failureReason: string | null;
    retryCount: number;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Map delivery record to response
 */
export function mapDeliveryToResponse(record: DeliveryDbRecord): DeliveryResponse {
    return {
        id: record.id,
        notificationId: record.notificationId,
        channel: record.channel as DeliveryResponse['channel'],
        provider: record.provider,
        target: record.target,
        status: record.status as DeliveryResponse['status'],
        failureReason: record.failureReason,
        retryCount: record.retryCount,
        createdAt: record.createdAt,
    };
}
