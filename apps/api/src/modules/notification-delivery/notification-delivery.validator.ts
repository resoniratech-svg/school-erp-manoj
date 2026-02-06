/**
 * Notification Delivery Validators
 */
import { z } from 'zod';
import { DELIVERY_STATUS, DELIVERY_CHANNEL } from './notification-delivery.constants';

// List deliveries query
export const listDeliveriesSchema = z.object({
    query: z.object({
        notificationId: z.string().uuid().optional(),
        channel: z.enum([DELIVERY_CHANNEL.EMAIL, DELIVERY_CHANNEL.SMS, DELIVERY_CHANNEL.WHATSAPP]).optional(),
        status: z.enum([DELIVERY_STATUS.PENDING, DELIVERY_STATUS.SENT, DELIVERY_STATUS.FAILED]).optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});

// Get delivery by ID
export const deliveryIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

// Retry delivery
export const retryDeliverySchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

// Type exports
export type ListDeliveriesQuery = z.infer<typeof listDeliveriesSchema>['query'];
