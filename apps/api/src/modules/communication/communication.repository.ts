/**
 * Communication Repository
 */
import { db } from '@school-erp/database';

const announcementSelectFields = {
    id: true,
    tenantId: true,
    branchId: true,
    title: true,
    content: true,
    targetGroup: true,
    targetClassId: true,
    targetSectionId: true,
    status: true,
    priority: true,
    publishedAt: true,
    expiresAt: true,
    createdByUserId: true,
    createdAt: true,
    updatedAt: true,
} as const;

const notificationSelectFields = {
    id: true,
    tenantId: true,
    userId: true,
    type: true,
    title: true,
    message: true,
    data: true,
    status: true,
    readAt: true,
    createdAt: true,
} as const;

const notificationLogSelectFields = {
    id: true,
    notificationId: true,
    channel: true,
    status: true,
    attemptedAt: true,
    deliveredAt: true,
    errorMessage: true,
} as const;

export class CommunicationRepository {
    // ==================== ANNOUNCEMENTS ====================

    async findAnnouncementById(id: string, tenantId: string, branchId: string) {
        return db.announcement.findFirst({
            where: { id, tenantId, branchId },
            select: announcementSelectFields,
        });
    }

    async findAnnouncements(tenantId: string, branchId: string, filters?: {
        status?: string;
        targetGroup?: string;
    }) {
        return db.announcement.findMany({
            where: {
                tenantId,
                branchId,
                ...(filters?.status && { status: filters.status }),
                ...(filters?.targetGroup && { targetGroup: filters.targetGroup }),
            },
            select: announcementSelectFields,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findActiveAnnouncements(tenantId: string, branchId: string, targetGroups: string[]) {
        return db.announcement.findMany({
            where: {
                tenantId,
                branchId,
                status: 'published',
                targetGroup: { in: targetGroups },
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: new Date() } },
                ],
            },
            select: announcementSelectFields,
            orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
        });
    }

    async createAnnouncement(data: {
        tenantId: string;
        branchId: string;
        title: string;
        content: string;
        targetGroup: string;
        targetClassId?: string;
        targetSectionId?: string;
        priority: string;
        expiresAt?: Date;
        createdByUserId: string;
    }) {
        return db.announcement.create({
            data: {
                ...data,
                status: 'draft',
            },
            select: announcementSelectFields,
        });
    }

    async updateAnnouncement(id: string, data: {
        title?: string;
        content?: string;
        priority?: string;
        expiresAt?: Date | null;
    }) {
        return db.announcement.update({
            where: { id },
            data,
            select: announcementSelectFields,
        });
    }

    async publishAnnouncement(id: string) {
        return db.announcement.update({
            where: { id },
            data: {
                status: 'published',
                publishedAt: new Date(),
            },
            select: announcementSelectFields,
        });
    }

    async archiveAnnouncement(id: string) {
        return db.announcement.update({
            where: { id },
            data: { status: 'archived' },
            select: announcementSelectFields,
        });
    }

    // ==================== NOTIFICATIONS (APPEND-ONLY) ====================

    async findNotificationById(id: string, tenantId: string) {
        return db.notification.findFirst({
            where: { id, tenantId },
            select: notificationSelectFields,
        });
    }

    async findNotifications(tenantId: string, filters?: {
        userId?: string;
        type?: string;
        status?: string;
    }) {
        return db.notification.findMany({
            where: {
                tenantId,
                ...(filters?.userId && { userId: filters.userId }),
                ...(filters?.type && { type: filters.type }),
                ...(filters?.status && { status: filters.status }),
            },
            select: notificationSelectFields,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    async findUserNotifications(userId: string, tenantId: string) {
        return db.notification.findMany({
            where: {
                userId,
                tenantId,
            },
            select: notificationSelectFields,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async findUnreadCount(userId: string, tenantId: string) {
        return db.notification.count({
            where: {
                userId,
                tenantId,
                readAt: null,
            },
        });
    }

    /**
     * Create notification (append-only)
     */
    async createNotification(data: {
        tenantId: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        data?: Record<string, unknown>;
    }) {
        return db.notification.create({
            data: {
                ...data,
                status: 'pending',
                data: data.data ? JSON.stringify(data.data) : null,
            },
            select: notificationSelectFields,
        });
    }

    /**
     * Bulk create notifications (append-only)
     */
    async createManyNotifications(notifications: Array<{
        tenantId: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        data?: Record<string, unknown>;
    }>) {
        return db.$transaction(
            notifications.map((n) =>
                db.notification.create({
                    data: {
                        ...n,
                        status: 'pending',
                        data: n.data ? JSON.stringify(n.data) : null,
                    },
                    select: notificationSelectFields,
                })
            )
        );
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id: string) {
        return db.notification.update({
            where: { id },
            data: {
                status: 'read',
                readAt: new Date(),
            },
            select: notificationSelectFields,
        });
    }

    /**
     * Mark all notifications as read for user
     */
    async markAllAsRead(userId: string, tenantId: string) {
        return db.notification.updateMany({
            where: {
                userId,
                tenantId,
                readAt: null,
            },
            data: {
                status: 'read',
                readAt: new Date(),
            },
        });
    }

    // ==================== NOTIFICATION LOGS (APPEND-ONLY) ====================

    async createNotificationLog(data: {
        notificationId: string;
        channel: string;
        status: string;
        errorMessage?: string;
    }) {
        return db.notificationLog.create({
            data: {
                ...data,
                attemptedAt: new Date(),
                deliveredAt: data.status === 'sent' ? new Date() : null,
            },
            select: notificationLogSelectFields,
        });
    }

    async findNotificationLogs(notificationId: string) {
        return db.notificationLog.findMany({
            where: { notificationId },
            select: notificationLogSelectFields,
            orderBy: { attemptedAt: 'desc' },
        });
    }

    // ==================== TARGET RESOLUTION ====================

    async findUsersByTargetGroup(
        tenantId: string,
        branchId: string,
        targetGroup: string,
        targetClassId?: string,
        targetSectionId?: string
    ): Promise<string[]> {
        let userIds: string[] = [];

        switch (targetGroup) {
            case 'all':
                const allUsers = await db.user.findMany({
                    where: { tenantId, deletedAt: null },
                    select: { id: true },
                });
                userIds = allUsers.map((u) => u.id);
                break;

            case 'students':
                const students = await db.student.findMany({
                    where: { tenantId, deletedAt: null, status: 'active' },
                    select: { userId: true },
                });
                userIds = students.filter((s) => s.userId).map((s) => s.userId!);
                break;

            case 'staff':
                const staff = await db.staff.findMany({
                    where: { tenantId, branchId, deletedAt: null, status: 'active' },
                    select: { userId: true },
                });
                userIds = staff.filter((s) => s.userId).map((s) => s.userId!);
                break;

            case 'class':
                if (targetClassId) {
                    const classStudents = await db.studentEnrollment.findMany({
                        where: {
                            section: { classId: targetClassId, branch: { tenantId } },
                            status: 'active',
                        },
                        select: { student: { select: { userId: true } } },
                    });
                    userIds = classStudents.filter((e) => e.student.userId).map((e) => e.student.userId!);
                }
                break;

            case 'section':
                if (targetSectionId) {
                    const sectionStudents = await db.studentEnrollment.findMany({
                        where: { sectionId: targetSectionId, status: 'active' },
                        select: { student: { select: { userId: true } } },
                    });
                    userIds = sectionStudents.filter((e) => e.student.userId).map((e) => e.student.userId!);
                }
                break;
        }

        return userIds;
    }
}

export const communicationRepository = new CommunicationRepository();
