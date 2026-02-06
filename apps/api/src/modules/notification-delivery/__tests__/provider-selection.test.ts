/**
 * Provider Selection Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeliveryService } from '../notification-delivery.service';
import type { DeliveryRepository } from '../notification-delivery.repository';
import { DELIVERY_CHANNEL, DELIVERY_STATUS } from '../notification-delivery.constants';

// Mock config service to control provider selection
vi.mock('../../config', () => ({
    configService: {
        getConfigByKey: vi.fn(),
    },
}));

import { configService } from '../../config';

// Mock providers
vi.mock('../providers/email', () => ({
    smtpProvider: { name: 'smtp', send: vi.fn().mockResolvedValue({ success: true }) },
    sesProvider: { name: 'ses', send: vi.fn().mockResolvedValue({ success: true }) },
}));
vi.mock('../providers/sms', () => ({
    twilioProvider: { name: 'twilio', send: vi.fn().mockResolvedValue({ success: true }) },
    msg91Provider: { name: 'msg91', send: vi.fn().mockResolvedValue({ success: true }) },
}));
vi.mock('../providers/whatsapp', () => ({
    metaWhatsAppProvider: { name: 'meta', send: vi.fn().mockResolvedValue({ success: true }) },
}));

import { smtpProvider, sesProvider } from '../providers/email';
import { twilioProvider, msg91Provider } from '../providers/sms';

describe('Provider Selection', () => {
    let service: DeliveryService;
    let mockRepository: {
        findById: ReturnType<typeof vi.fn>;
        findDeliveries: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        updateStatus: ReturnType<typeof vi.fn>;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockRepository = {
            findById: vi.fn(),
            findDeliveries: vi.fn(),
            create: vi.fn().mockResolvedValue({
                id: 'del-1',
                notificationId: 'notif-1',
                channel: DELIVERY_CHANNEL.EMAIL,
                provider: 'smtp',
                target: 'test@example.com',
                payloadHash: 'hash',
                status: DELIVERY_STATUS.PENDING,
                failureReason: null,
                retryCount: 0,
                tenantId: 'tenant-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            }),
            updateStatus: vi.fn(),
        };
        mockRepository.findById.mockImplementation(async () => ({
            ...mockRepository.create.mock.results[0]?.value,
            status: DELIVERY_STATUS.SENT,
        }));
        service = new DeliveryService(mockRepository as unknown as DeliveryRepository);
    });

    describe('SMTP selected when configured', () => {
        it('should use SMTP provider when configured', async () => {
            (configService.getConfigByKey as ReturnType<typeof vi.fn>)
                .mockImplementation((key: string) => {
                    if (key === 'notification.email.provider') return Promise.resolve({ value: 'smtp' });
                    if (key.includes('enabled')) return Promise.resolve({ value: true });
                    return Promise.resolve({ value: null });
                });

            await service.dispatch(
                {
                    notificationId: 'notif-1',
                    channel: DELIVERY_CHANNEL.EMAIL,
                    target: 'test@example.com',
                    payload: { subject: 'Test' },
                },
                mockContext
            );

            expect(smtpProvider.send).toHaveBeenCalled();
            expect(sesProvider.send).not.toHaveBeenCalled();
        });
    });

    describe('Twilio selected when configured', () => {
        it('should use Twilio provider when configured', async () => {
            mockRepository.create.mockResolvedValue({
                id: 'del-1',
                notificationId: 'notif-1',
                channel: DELIVERY_CHANNEL.SMS,
                provider: 'twilio',
                target: '+1234567890',
                payloadHash: 'hash',
                status: DELIVERY_STATUS.PENDING,
                failureReason: null,
                retryCount: 0,
                tenantId: 'tenant-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            (configService.getConfigByKey as ReturnType<typeof vi.fn>)
                .mockImplementation((key: string) => {
                    if (key === 'notification.sms.provider') return Promise.resolve({ value: 'twilio' });
                    if (key.includes('enabled')) return Promise.resolve({ value: true });
                    return Promise.resolve({ value: null });
                });

            await service.dispatch(
                {
                    notificationId: 'notif-1',
                    channel: DELIVERY_CHANNEL.SMS,
                    target: '+1234567890',
                    payload: { message: 'Test' },
                },
                mockContext
            );

            expect(twilioProvider.send).toHaveBeenCalled();
            expect(msg91Provider.send).not.toHaveBeenCalled();
        });
    });

    describe('provider missing graceful failure', () => {
        it('should create failed record when channel disabled', async () => {
            (configService.getConfigByKey as ReturnType<typeof vi.fn>)
                .mockImplementation((key: string) => {
                    if (key === 'notification.email.enabled') return Promise.resolve({ value: false });
                    return Promise.resolve({ value: null });
                });

            mockRepository.create.mockResolvedValue({
                id: 'del-1',
                status: DELIVERY_STATUS.FAILED,
                failureReason: 'CHANNEL_DISABLED',
                channel: DELIVERY_CHANNEL.EMAIL,
                provider: 'none',
                target: 'test@example.com',
                payloadHash: 'hash',
                notificationId: 'notif-1',
                retryCount: 0,
                tenantId: 'tenant-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const result = await service.dispatch(
                {
                    notificationId: 'notif-1',
                    channel: DELIVERY_CHANNEL.EMAIL,
                    target: 'test@example.com',
                    payload: {},
                },
                mockContext
            );

            expect(result.status).toBe(DELIVERY_STATUS.FAILED);
            expect(smtpProvider.send).not.toHaveBeenCalled();
        });
    });
});
