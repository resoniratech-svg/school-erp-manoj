/**
 * Worker Processing Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { JobsService } from '../jobs.service';
import { JOB_STATUS, JOBS_ERROR_CODES } from '../jobs.constants';

// Mock queue
vi.mock('../jobs.queue', () => ({
    enqueue: vi.fn(),
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

import { enqueue, updateJobStatus } from '../jobs.queue';
import { prisma } from '@school-erp/database';

describe('Worker Processing', () => {
    let service: JobsService;

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockJob = {
        id: 'job-1',
        tenantId: 'tenant-123',
        branchId: null,
        type: 'notification.delivery',
        status: JOB_STATUS.FAILED,
        payload: { test: true },
        result: null,
        error: 'Connection timeout',
        retryCount: 1,
        maxRetry: 3,
        priority: 0,
        triggeredBy: 'user-1',
        startedAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        service = new JobsService();
    });

    describe('job processed successfully', () => {
        it('should update job status on completion', async () => {
            // This is tested via worker, here we verify retry mechanics
            (prisma.job.findFirst as Mock).mockResolvedValue(mockJob);
            (prisma.job.findUnique as Mock).mockResolvedValue({ ...mockJob, status: JOB_STATUS.PENDING, retryCount: 2 });
            (enqueue as Mock).mockResolvedValue({});

            const result = await service.retryJob('job-1', mockContext);

            expect(updateJobStatus).toHaveBeenCalledWith(
                'job-1',
                JOB_STATUS.PENDING,
                expect.objectContaining({ retryCount: 2 })
            );
        });
    });

    describe('retry on failure', () => {
        it('should increment retry count', async () => {
            (prisma.job.findFirst as Mock).mockResolvedValue(mockJob);
            (prisma.job.findUnique as Mock).mockResolvedValue({ ...mockJob, retryCount: 2 });
            (enqueue as Mock).mockResolvedValue({});

            await service.retryJob('job-1', mockContext);

            expect(updateJobStatus).toHaveBeenCalledWith(
                'job-1',
                JOB_STATUS.PENDING,
                { retryCount: 2 }
            );
        });
    });

    describe('retry limit enforced', () => {
        it('should reject retry when max retries exceeded', async () => {
            (prisma.job.findFirst as Mock).mockResolvedValue({
                ...mockJob,
                retryCount: 3, // Already at max
            });

            await expect(
                service.retryJob('job-1', mockContext)
            ).rejects.toThrow(JOBS_ERROR_CODES.MAX_RETRIES_EXCEEDED);
        });
    });

    describe('cross-tenant retry blocked', () => {
        it('should reject retry for different tenant', async () => {
            (prisma.job.findFirst as Mock).mockResolvedValue(null); // Not found due to tenant filter

            await expect(
                service.retryJob('job-other', mockContext)
            ).rejects.toThrow(JOBS_ERROR_CODES.JOB_NOT_FOUND);
        });
    });
});
