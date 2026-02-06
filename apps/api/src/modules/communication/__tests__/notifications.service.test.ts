/**
 * Notifications Service Unit Tests
 * CRITICAL: Tests for append-only behavior
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { CommunicationService } from '../communication.service';
import type { CommunicationRepository } from '../communication.repository';
import { NOTIFICATION_TYPE, NOTIFICATION_STATUS } from '../communication.constants';

describe('CommunicationService - Notifications', () => {
    let service: CommunicationService;
    let mockRepository: {
        findNotificationById: Mock;
        findNotifications: Mock;
        findUserNotifications: Mock;
        findUnreadCount: Mock;
        createNotification: Mock;
        createManyNotifications: Mock;
        markAsRead: Mock;
        markAllAsRead: Mock;
        createNotificationLog: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockNotification = {
        id: 'notif-1',
        tenantId: 'tenant-123',
        userId: 'user-1',
        type: NOTIFICATION_TYPE.GENERAL,
        title: 'Test Notification',
        message: 'This is a test',
        data: null,
        status: NOTIFICATION_STATUS.PENDING,
        readAt: null,
        createdAt: new Date(),
    };

    beforeEach(() => {
        mockRepository = {
            findNotificationById: vi.fn(),
            findNotifications: vi.fn(),
            findUserNotifications: vi.fn(),
            findUnreadCount: vi.fn(),
            createNotification: vi.fn(),
            createManyNotifications: vi.fn(),
            markAsRead: vi.fn(),
            markAllAsRead: vi.fn(),
            createNotificationLog: vi.fn(),
        };

        service = new CommunicationService(mockRepository as unknown as CommunicationRepository);
    });

    describe('sendNotification', () => {
        it('should create notification and log delivery', async () => {
            mockRepository.createNotification.mockResolvedValue(mockNotification);
            mockRepository.createNotificationLog.mockResolvedValue({ id: 'log-1' });

            const result = await service.sendNotification(
                {
                    userId: 'user-1',
                    type: NOTIFICATION_TYPE.GENERAL,
                    title: 'Test',
                    message: 'Test message',
                },
                mockContext
            );

            expect(result.id).toBe('notif-1');
            expect(mockRepository.createNotificationLog).toHaveBeenCalledWith({
                notificationId: 'notif-1',
                channel: 'in_app',
                status: 'sent',
            });
        });
    });

    describe('sendBulkNotification', () => {
        it('should create multiple notifications', async () => {
            const notifications = [
                { ...mockNotification, id: 'n1' },
                { ...mockNotification, id: 'n2' },
            ];
            mockRepository.createManyNotifications.mockResolvedValue(notifications);
            mockRepository.createNotificationLog.mockResolvedValue({ id: 'log' });

            const result = await service.sendBulkNotification(
                {
                    userIds: ['user-1', 'user-2'],
                    type: NOTIFICATION_TYPE.GENERAL,
                    title: 'Bulk Test',
                    message: 'Bulk message',
                },
                mockContext
            );

            expect(result.sent).toBe(2);
            expect(result.failed).toBe(0);
        });
    });

    describe('notification immutability', () => {
        it('should not have delete method exposed', () => {
            // Verify delete method doesn't exist on service
            expect((service as unknown as { deleteNotification?: unknown }).deleteNotification).toBeUndefined();
        });

        it('should log all delivery attempts', async () => {
            mockRepository.createNotification.mockResolvedValue(mockNotification);
            mockRepository.createNotificationLog.mockResolvedValue({ id: 'log-1' });

            await service.sendNotification(
                {
                    userId: 'user-1',
                    type: NOTIFICATION_TYPE.GENERAL,
                    title: 'Test',
                    message: 'Test',
                },
                mockContext
            );

            expect(mockRepository.createNotificationLog).toHaveBeenCalled();
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
            mockRepository.findNotificationById.mockResolvedValue(mockNotification);
            mockRepository.markAsRead.mockResolvedValue({
                ...mockNotification,
                status: NOTIFICATION_STATUS.READ,
                readAt: new Date(),
            });

            const result = await service.markNotificationAsRead('notif-1', mockContext);

            expect(result.status).toBe(NOTIFICATION_STATUS.READ);
        });
    });

    describe('cross-tenant rejection', () => {
        it('should reject notification from different tenant', async () => {
            mockRepository.findNotificationById.mockResolvedValue(null);

            await expect(
                service.getNotification('notif-other', mockContext)
            ).rejects.toThrow('Notification not found');
        });
    });
});
