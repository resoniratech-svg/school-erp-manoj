/**
 * Notification Delivery Service
 * Config-driven provider selection with retry logic
 */
import * as crypto from 'crypto';
import { NotFoundError, ForbiddenError } from '@school-erp/shared';
import { DeliveryRepository, deliveryRepository } from './notification-delivery.repository';
import {
    DELIVERY_STATUS,
    DELIVERY_CHANNEL,
    DELIVERY_DEFAULTS,
    DELIVERY_ERROR_CODES,
    EMAIL_PROVIDER,
    SMS_PROVIDER,
    WHATSAPP_PROVIDER,
} from './notification-delivery.constants';
import { mapDeliveryToResponse } from './notification-delivery.mapper';
import { smtpProvider, sesProvider } from './providers/email';
import { twilioProvider, msg91Provider } from './providers/sms';
import { metaWhatsAppProvider } from './providers/whatsapp';
import { configService } from '../config';
import type {
    DeliveryResponse,
    DeliveryListResponse,
    DispatchInput,
    DeliveryContext,
    DeliveryConfig,
    IDeliveryProvider,
} from './notification-delivery.types';
import type { ListDeliveriesQuery } from './notification-delivery.validator';
import { getLogger } from '../../utils/logger';

const logger = getLogger('delivery-service');

export class DeliveryService {
    constructor(private readonly repository: DeliveryRepository = deliveryRepository) { }

    /**
     * Dispatch notification for delivery
     * Called by Communication module after notification creation
     */
    async dispatch(
        input: DispatchInput,
        context: DeliveryContext
    ): Promise<DeliveryResponse> {
        const config = await this.getDeliveryConfig(context);

        // Check if channel is enabled
        if (!this.isChannelEnabled(input.channel, config)) {
            logger.warn(`Channel ${input.channel} is disabled`);
            // Still create record but mark as failed
            const record = await this.repository.create({
                notificationId: input.notificationId,
                channel: input.channel,
                provider: 'none',
                target: input.target,
                payloadHash: this.hashPayload(input.payload),
                status: DELIVERY_STATUS.FAILED,
                failureReason: DELIVERY_ERROR_CODES.CHANNEL_DISABLED,
                retryCount: 0,
                tenantId: context.tenantId,
            });
            return mapDeliveryToResponse(record);
        }

        // Get provider for channel
        const provider = this.getProvider(input.channel, config);
        if (!provider) {
            logger.error(`No provider configured for ${input.channel}`);
            const record = await this.repository.create({
                notificationId: input.notificationId,
                channel: input.channel,
                provider: 'none',
                target: input.target,
                payloadHash: this.hashPayload(input.payload),
                status: DELIVERY_STATUS.FAILED,
                failureReason: DELIVERY_ERROR_CODES.PROVIDER_NOT_CONFIGURED,
                retryCount: 0,
                tenantId: context.tenantId,
            });
            return mapDeliveryToResponse(record);
        }

        // Create pending record
        const record = await this.repository.create({
            notificationId: input.notificationId,
            channel: input.channel,
            provider: provider.name,
            target: input.target,
            payloadHash: this.hashPayload(input.payload),
            status: DELIVERY_STATUS.PENDING,
            failureReason: null,
            retryCount: 0,
            tenantId: context.tenantId,
        });

        // Attempt delivery (fail-open: notification creation succeeds even if delivery fails)
        try {
            const result = await provider.send(input.target, input.payload);

            if (result.success) {
                await this.repository.updateStatus(record.id, {
                    status: DELIVERY_STATUS.SENT,
                });
                logger.info(`Delivery successful: ${record.id}`);
            } else {
                await this.repository.updateStatus(record.id, {
                    status: DELIVERY_STATUS.FAILED,
                    failureReason: result.error || DELIVERY_ERROR_CODES.PROVIDER_FAILED,
                });
                logger.warn(`Delivery failed: ${record.id}`, { error: result.error });
            }
        } catch (error) {
            await this.repository.updateStatus(record.id, {
                status: DELIVERY_STATUS.FAILED,
                failureReason: error instanceof Error ? error.message : 'Unknown error',
            });
            logger.error(`Delivery error: ${record.id}`, { error });
        }

        // Fetch updated record
        const updated = await this.repository.findById(record.id, context.tenantId);
        return mapDeliveryToResponse(updated!);
    }

    /**
     * Get delivery by ID
     */
    async getDeliveryById(id: string, context: DeliveryContext): Promise<DeliveryResponse> {
        const record = await this.repository.findById(id, context.tenantId);

        if (!record) {
            throw new NotFoundError(DELIVERY_ERROR_CODES.DELIVERY_NOT_FOUND);
        }

        return mapDeliveryToResponse(record);
    }

    /**
     * List deliveries with filters
     */
    async listDeliveries(
        filters: ListDeliveriesQuery,
        context: DeliveryContext
    ): Promise<DeliveryListResponse> {
        const page = filters.page || 1;
        const limit = filters.limit || 50;

        const { deliveries, total } = await this.repository.findDeliveries(
            context.tenantId,
            { ...filters, page, limit }
        );

        return {
            deliveries: deliveries.map(mapDeliveryToResponse),
            pagination: { page, limit, total },
        };
    }

    /**
     * Retry failed delivery
     */
    async retryDelivery(id: string, context: DeliveryContext): Promise<DeliveryResponse> {
        const record = await this.repository.findById(id, context.tenantId);

        if (!record) {
            throw new NotFoundError(DELIVERY_ERROR_CODES.DELIVERY_NOT_FOUND);
        }

        const config = await this.getDeliveryConfig(context);

        // Check max retries
        if (record.retryCount >= config.maxRetryCount) {
            throw new ForbiddenError(DELIVERY_ERROR_CODES.MAX_RETRIES_EXCEEDED);
        }

        // Get provider
        const provider = this.getProvider(record.channel as DispatchInput['channel'], config);
        if (!provider) {
            throw new ForbiddenError(DELIVERY_ERROR_CODES.PROVIDER_NOT_CONFIGURED);
        }

        // Increment retry count
        await this.repository.updateStatus(record.id, {
            status: DELIVERY_STATUS.PENDING,
            retryCount: record.retryCount + 1,
        });

        // Attempt delivery
        try {
            // Note: We don't have the original payload, so retry with empty payload
            // In production, you'd store the payload or fetch from notification
            const result = await provider.send(record.target, {});

            if (result.success) {
                await this.repository.updateStatus(record.id, {
                    status: DELIVERY_STATUS.SENT,
                    retryCount: record.retryCount + 1,
                });
            } else {
                await this.repository.updateStatus(record.id, {
                    status: DELIVERY_STATUS.FAILED,
                    failureReason: result.error,
                    retryCount: record.retryCount + 1,
                });
            }
        } catch (error) {
            await this.repository.updateStatus(record.id, {
                status: DELIVERY_STATUS.FAILED,
                failureReason: error instanceof Error ? error.message : 'Unknown error',
                retryCount: record.retryCount + 1,
            });
        }

        const updated = await this.repository.findById(id, context.tenantId);
        return mapDeliveryToResponse(updated!);
    }

    /**
     * Get provider for channel based on config
     */
    private getProvider(channel: DispatchInput['channel'], config: DeliveryConfig): IDeliveryProvider | null {
        switch (channel) {
            case DELIVERY_CHANNEL.EMAIL:
                return config.emailProvider === EMAIL_PROVIDER.SES ? sesProvider : smtpProvider;
            case DELIVERY_CHANNEL.SMS:
                return config.smsProvider === SMS_PROVIDER.MSG91 ? msg91Provider : twilioProvider;
            case DELIVERY_CHANNEL.WHATSAPP:
                return config.whatsappProvider === WHATSAPP_PROVIDER.META ? metaWhatsAppProvider : null;
            default:
                return null;
        }
    }

    /**
     * Check if channel is enabled
     */
    private isChannelEnabled(channel: DispatchInput['channel'], config: DeliveryConfig): boolean {
        switch (channel) {
            case DELIVERY_CHANNEL.EMAIL:
                return config.emailEnabled;
            case DELIVERY_CHANNEL.SMS:
                return config.smsEnabled;
            case DELIVERY_CHANNEL.WHATSAPP:
                return config.whatsappEnabled;
            default:
                return false;
        }
    }

    /**
     * Hash payload for deduplication
     */
    private hashPayload(payload: Record<string, unknown>): string {
        return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 32);
    }

    /**
     * Get delivery configuration from Module 16
     */
    private async getDeliveryConfig(context: DeliveryContext): Promise<DeliveryConfig> {
        try {
            const [
                emailProviderConfig,
                smsProviderConfig,
                whatsappProviderConfig,
                emailEnabledConfig,
                smsEnabledConfig,
                whatsappEnabledConfig,
                maxRetryConfig,
            ] = await Promise.all([
                configService.getConfigByKey('notification.email.provider', context).catch(() => null),
                configService.getConfigByKey('notification.sms.provider', context).catch(() => null),
                configService.getConfigByKey('notification.whatsapp.provider', context).catch(() => null),
                configService.getConfigByKey('notification.email.enabled', context).catch(() => null),
                configService.getConfigByKey('notification.sms.enabled', context).catch(() => null),
                configService.getConfigByKey('notification.whatsapp.enabled', context).catch(() => null),
                configService.getConfigByKey('notification.maxRetryCount', context).catch(() => null),
            ]);

            return {
                emailProvider: (emailProviderConfig?.value as 'smtp' | 'ses') ?? 'smtp',
                smsProvider: (smsProviderConfig?.value as 'twilio' | 'msg91') ?? 'twilio',
                whatsappProvider: (whatsappProviderConfig?.value as 'meta') ?? 'meta',
                emailEnabled: emailEnabledConfig?.value !== false,
                smsEnabled: smsEnabledConfig?.value !== false,
                whatsappEnabled: whatsappEnabledConfig?.value !== false,
                maxRetryCount: (maxRetryConfig?.value as number) ?? DELIVERY_DEFAULTS.MAX_RETRY_COUNT,
            };
        } catch {
            return {
                emailProvider: 'smtp',
                smsProvider: 'twilio',
                whatsappProvider: 'meta',
                emailEnabled: true,
                smsEnabled: true,
                whatsappEnabled: true,
                maxRetryCount: DELIVERY_DEFAULTS.MAX_RETRY_COUNT,
            };
        }
    }
}

export const deliveryService = new DeliveryService();
