/**
 * Announcements Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { CommunicationService } from '../communication.service';
import type { CommunicationRepository } from '../communication.repository';
import { ANNOUNCEMENT_STATUS, TARGET_GROUP } from '../communication.constants';

describe('CommunicationService - Announcements', () => {
    let service: CommunicationService;
    let mockRepository: {
        findAnnouncementById: Mock;
        findAnnouncements: Mock;
        createAnnouncement: Mock;
        updateAnnouncement: Mock;
        publishAnnouncement: Mock;
        archiveAnnouncement: Mock;
        findUsersByTargetGroup: Mock;
        createManyNotifications: Mock;
        createNotificationLog: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockAnnouncement = {
        id: 'ann-1',
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        title: 'School Holiday',
        content: 'Tomorrow is a holiday',
        targetGroup: TARGET_GROUP.ALL,
        targetClassId: null,
        targetSectionId: null,
        status: ANNOUNCEMENT_STATUS.DRAFT,
        priority: 'normal',
        publishedAt: null,
        expiresAt: null,
        createdByUserId: 'user-789',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        mockRepository = {
            findAnnouncementById: vi.fn(),
            findAnnouncements: vi.fn(),
            createAnnouncement: vi.fn(),
            updateAnnouncement: vi.fn(),
            publishAnnouncement: vi.fn(),
            archiveAnnouncement: vi.fn(),
            findUsersByTargetGroup: vi.fn(),
            createManyNotifications: vi.fn(),
            createNotificationLog: vi.fn(),
        };

        service = new CommunicationService(mockRepository as unknown as CommunicationRepository);
    });

    describe('createAnnouncement', () => {
        it('should create announcement successfully', async () => {
            mockRepository.createAnnouncement.mockResolvedValue(mockAnnouncement);

            const result = await service.createAnnouncement(
                {
                    title: 'School Holiday',
                    content: 'Tomorrow is a holiday',
                    targetGroup: TARGET_GROUP.ALL,
                    priority: 'normal',
                },
                mockContext
            );

            expect(result.title).toBe('School Holiday');
            expect(result.status).toBe(ANNOUNCEMENT_STATUS.DRAFT);
        });
    });

    describe('publishAnnouncement', () => {
        it('should publish announcement and lock it', async () => {
            mockRepository.findAnnouncementById.mockResolvedValue(mockAnnouncement);
            mockRepository.publishAnnouncement.mockResolvedValue({
                ...mockAnnouncement,
                status: ANNOUNCEMENT_STATUS.PUBLISHED,
                publishedAt: new Date(),
            });
            mockRepository.findUsersByTargetGroup.mockResolvedValue(['user-1', 'user-2']);
            mockRepository.createManyNotifications.mockResolvedValue([
                { id: 'notif-1' },
                { id: 'notif-2' },
            ]);

            const result = await service.publishAnnouncement('ann-1', mockContext);

            expect(result.status).toBe(ANNOUNCEMENT_STATUS.PUBLISHED);
            expect(mockRepository.publishAnnouncement).toHaveBeenCalledWith('ann-1');
        });

        it('should reject already published announcement', async () => {
            mockRepository.findAnnouncementById.mockResolvedValue({
                ...mockAnnouncement,
                status: ANNOUNCEMENT_STATUS.PUBLISHED,
            });

            await expect(
                service.publishAnnouncement('ann-1', mockContext)
            ).rejects.toThrow('Announcement is already published');
        });
    });

    describe('updateAnnouncement', () => {
        it('should reject editing published announcement', async () => {
            mockRepository.findAnnouncementById.mockResolvedValue({
                ...mockAnnouncement,
                status: ANNOUNCEMENT_STATUS.PUBLISHED,
            });

            await expect(
                service.updateAnnouncement('ann-1', { title: 'New Title' }, mockContext)
            ).rejects.toThrow('Cannot edit published announcement');
        });
    });

    describe('target resolution', () => {
        it('should resolve target group correctly', async () => {
            mockRepository.findAnnouncementById.mockResolvedValue(mockAnnouncement);
            mockRepository.publishAnnouncement.mockResolvedValue({
                ...mockAnnouncement,
                status: ANNOUNCEMENT_STATUS.PUBLISHED,
            });
            mockRepository.findUsersByTargetGroup.mockResolvedValue(['user-1', 'user-2', 'user-3']);
            mockRepository.createManyNotifications.mockResolvedValue([
                { id: 'n1' },
                { id: 'n2' },
                { id: 'n3' },
            ]);

            await service.publishAnnouncement('ann-1', mockContext);

            expect(mockRepository.findUsersByTargetGroup).toHaveBeenCalledWith(
                'tenant-123',
                'branch-456',
                TARGET_GROUP.ALL,
                undefined,
                undefined
            );
        });
    });

    describe('cross-tenant rejection', () => {
        it('should reject announcement from different tenant', async () => {
            mockRepository.findAnnouncementById.mockResolvedValue(null); // Not found

            await expect(
                service.getAnnouncementById('ann-other', mockContext)
            ).rejects.toThrow('Announcement not found');
        });
    });
});
