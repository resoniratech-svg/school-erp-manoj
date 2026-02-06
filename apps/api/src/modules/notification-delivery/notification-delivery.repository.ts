/**
 * Notification Delivery Repository
 * APPEND-ONLY - NO DELETE
 */
import { prisma } from '@school-erp/database';
import type { DeliveryChannel, DeliveryStatus } from './notification-delivery.types';

export class DeliveryRepository {
    /**
     * Find delivery by ID (tenant-scoped)
     */
    async findById(id: string, tenantId: string) {
        return prisma.notificationDelivery.findFirst({
            where: { id, tenantId },
        });
    }

    /**
     * Find deliveries with filters
     */
    async findDeliveries(
        tenantId: string,
        filters: {
            notificationId?: string;
            channel?: DeliveryChannel;
            status?: DeliveryStatus;
            page?: number;
            limit?: number;
        }
    ) {
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const skip = (page - 1) * limit;

        const where = {
            tenantId,
            ...(filters.notificationId && { notificationId: filters.notificationId }),
            ...(filters.channel && { channel: filters.channel }),
            ...(filters.status && { status: filters.status }),
        };

        const [deliveries, total] = await Promise.all([
            prisma.notificationDelivery.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.notificationDelivery.count({ where }),
        ]);

        return { deliveries, total };
    }

    /**
     * Create delivery record (APPEND operation)
     */
    async create(data: {
        notificationId: string;
        channel: DeliveryChannel;
        provider: string;
        target: string;
        payloadHash: string;
        status: DeliveryStatus;
        failureReason: string | null;
        retryCount: number;
        tenantId: string;
    }) {
        return prisma.notificationDelivery.create({
            data,
        });
    }

    /**
     * Update delivery status (only status, retryCount, failureReason)
     */
    async updateStatus(
        id: string,
        data: {
            status: DeliveryStatus;
            retryCount?: number;
            failureReason?: string | null;
        }
    ) {
        return prisma.notificationDelivery.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Find pending deliveries for retry
     */
    async findPendingRetries(tenantId: string, maxRetryCount: number) {
        return prisma.notificationDelivery.findMany({
            where: {
                tenantId,
                status: 'failed',
                retryCount: { lt: maxRetryCount },
            },
            orderBy: { createdAt: 'asc' },
            take: 100,
        });
    }

    // NO DELETE METHOD - Delivery records are append-only
}

export const deliveryRepository = new DeliveryRepository();
