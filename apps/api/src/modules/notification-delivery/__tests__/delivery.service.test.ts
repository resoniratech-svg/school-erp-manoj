/**
 * Delivery Service Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { DeliveryService } from '../notification-delivery.service';
import type { DeliveryRepository } from '../notification-delivery.repository';
import { DELIVERY_STATUS, DELIVERY_CHANNEL, DELIVERY_ERROR_CODES } from '../notification-delivery.constants';

// Mock providers
vi.mock('../providers/email', () => ({
    smtpProvider: { name: 'smtp', send: vi.fn() },
    sesProvider: { name: 'ses', send: vi.fn() },
}));
vi.mock('../providers/sms', () => ({
    twilioProvider: { name: 'twilio', send: vi.fn() },
    msg91Provider: { name: 'msg91', send: vi.fn() },
}));
vi.mock('../providers/whatsapp', () => ({
    metaWhatsAppProvider: { name: 'meta', send: vi.fn() },
}));
vi.mock('../../config', () => ({
    configService: { getConfigByKey: vi.fn() },
}));

import { smtpProvider } from '../providers/email';
import { twilioProvider } from '../providers/sms';

describe('DeliveryService', () => {
    let service: DeliveryService;
    let mockRepository: {
        findById: Mock;
        findDeliveries: Mock;
        create: Mock;
        updateStatus: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockDelivery = {
        id: 'del-1',
        notificationId: 'notif-1',
        channel: DELIVERY_CHANNEL.EMAIL,
        provider: 'smtp',
        target: 'test@example.com',
        payloadHash: 'abc123',
        status: DELIVERY_STATUS.PENDING,
        failureReason: null,
        retryCount: 0,
        tenantId: 'tenant-123',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockRepository = {
            findById: vi.fn(),
            findDeliveries: vi.fn(),
            create: vi.fn(),
            updateStatus: vi.fn(),
        };
        service = new DeliveryService(mockRepository as unknown as DeliveryRepository);
    });

    describe('email delivery success', () => {
        it('should deliver email successfully', async () => {
            mockRepository.create.mockResolvedValue(mockDelivery);
            mockRepository.findById.mockResolvedValue({ ...mockDelivery, status: DELIVERY_STATUS.SENT });
            mockRepository.updateStatus.mockResolvedValue({});
            (smtpProvider.send as Mock).mockResolvedValue({ success: true, messageId: 'msg-1' });

            const result = await service.dispatch(
                {
                    notificationId: 'notif-1',
                    channel: DELIVERY_CHANNEL.EMAIL,
                    target: 'test@example.com',
                    payload: { subject: 'Test', body: 'Hello' },
                },
                mockContext
            );

            expect(result.status).toBe(DELIVERY_STATUS.SENT);
        });
    });

    describe('SMS provider failure logged', () => {
        it('should log failure when SMS provider fails', async () => {
            mockRepository.create.mockResolvedValue({ ...mockDelivery, channel: DELIVERY_CHANNEL.SMS });
            mockRepository.findById.mockResolvedValue({ ...mockDelivery, channel: DELIVERY_CHANNEL.SMS, status: DELIVERY_STATUS.FAILED });
            mockRepository.updateStatus.mockResolvedValue({});
            (twilioProvider.send as Mock).mockResolvedValue({ success: false, error: 'API error' });

            const result = await service.dispatch(
                {
                    notificationId: 'notif-1',
                    channel: DELIVERY_CHANNEL.SMS,
                    target: '+1234567890',
                    payload: { message: 'Test' },
                },
                mockContext
            );

            expect(result.status).toBe(DELIVERY_STATUS.FAILED);
        });
    });

    describe('retry increases retryCount', () => {
        it('should increment retry count', async () => {
            mockRepository.findById.mockResolvedValue({ ...mockDelivery, retryCount: 1 });
            mockRepository.updateStatus.mockResolvedValue({});
            (smtpProvider.send as Mock).mockResolvedValue({ success: true });

            await service.retryDelivery('del-1', mockContext);

            expect(mockRepository.updateStatus).toHaveBeenCalledWith(
                'del-1',
                expect.objectContaining({ retryCount: 2 })
            );
        });
    });

    describe('retry stops after max attempts', () => {
        it('should reject retry when max retries exceeded', async () => {
            mockRepository.findById.mockResolvedValue({ ...mockDelivery, retryCount: 3 });

            await expect(
                service.retryDelivery('del-1', mockContext)
            ).rejects.toThrow(DELIVERY_ERROR_CODES.MAX_RETRIES_EXCEEDED);
        });
    });

    describe('cross-tenant retry rejected', () => {
        it('should reject retry for different tenant', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(
                service.retryDelivery('del-other', mockContext)
            ).rejects.toThrow(DELIVERY_ERROR_CODES.DELIVERY_NOT_FOUND);
        });
    });
});
