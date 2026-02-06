/**
 * Job Enqueue Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { JobsService } from '../jobs.service';
import { JOB_TYPE, JOBS_ERROR_CODES } from '../jobs.constants';

// Mock queue
vi.mock('../jobs.queue', () => ({
    enqueue: vi.fn().mockResolvedValue({
        id: 'job-1',
        tenantId: 'tenant-123',
        branchId: null,
        type: 'notification.delivery',
        status: 'pending',
        payload: {},
        retryCount: 0,
        maxRetry: 3,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
    }),
    updateJobStatus: vi.fn(),
}));

// Mock config
vi.mock('../jobs.config', () => ({
    getJobsConfig: vi.fn().mockResolvedValue({
        enabled: true,
        concurrency: 5,
        maxRetry: 3,
        backoffSeconds: 30,
    }),
}));

// Mock database
vi.mock('@school-erp/database', () => ({
    prisma: {
        job: {
            findFirst: vi.fn(),
            findMany: vi.fn().mockResolvedValue([]),
            count: vi.fn().mockResolvedValue(0),
            findUnique: vi.fn(),
        },
    },
}));

import { enqueue } from '../jobs.queue';
import { getJobsConfig } from '../jobs.config';

describe('Job Enqueue', () => {
    let service: JobsService;

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        service = new JobsService();
    });

    describe('job enqueued correctly', () => {
        it('should enqueue job with correct payload', async () => {
            const result = await service.enqueueJob(
                {
                    type: JOB_TYPE.NOTIFICATION_DELIVERY,
                    payload: { notificationId: 'notif-1' },
                },
                mockContext
            );

            expect(enqueue).toHaveBeenCalledWith(
                'tenant-123',
                'branch-456',
                JOB_TYPE.NOTIFICATION_DELIVERY,
                { notificationId: 'notif-1' },
                expect.objectContaining({
                    maxRetry: 3,
                    triggeredBy: 'user-789',
                })
            );
            expect(result.status).toBe('pending');
        });
    });

    describe('job stored with tenant isolation', () => {
        it('should include tenantId in job record', async () => {
            const result = await service.enqueueJob(
                {
                    type: JOB_TYPE.REPORT_GENERATE,
                    payload: { reportType: 'attendance' },
                },
                mockContext
            );

            expect(result.tenantId).toBe('tenant-123');
        });
    });

    describe('disabled jobs are rejected', () => {
        it('should reject job when jobs are disabled', async () => {
            (getJobsConfig as Mock).mockResolvedValueOnce({
                enabled: false,
                concurrency: 5,
                maxRetry: 3,
                backoffSeconds: 30,
            });

            await expect(
                service.enqueueJob(
                    {
                        type: JOB_TYPE.FEE_REMINDER,
                        payload: {},
                    },
                    mockContext
                )
            ).rejects.toThrow(JOBS_ERROR_CODES.JOBS_DISABLED);
        });
    });
});
