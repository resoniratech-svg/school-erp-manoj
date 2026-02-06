/**
 * Jobs Queue
 * In-memory queue with persistence abstraction
 * (Production: Replace with BullMQ/Redis)
 */
import { v4 as uuid } from 'uuid';
import { prisma } from '@school-erp/database';
import { JOB_STATUS, JOB_DEFAULTS } from './jobs.constants';
import type { JobPayload, JobType, JobRecord } from './jobs.types';
import { getLogger } from '../../utils/logger';

const logger = getLogger('jobs-queue');

// In-memory queue (placeholder for BullMQ)
const memoryQueue: Map<string, JobPayload[]> = new Map();

/**
 * Add job to queue
 */
export async function enqueue(
    tenantId: string,
    branchId: string | undefined,
    type: JobType,
    payload: Record<string, unknown>,
    options: {
        priority?: number;
        delay?: number;
        maxRetry?: number;
        triggeredBy?: string;
    } = {}
): Promise<JobRecord> {
    const jobId = uuid();

    // Create job record in database (APPEND-ONLY)
    const jobRecord = await prisma.job.create({
        data: {
            id: jobId,
            tenantId,
            branchId: branchId || null,
            type,
            status: JOB_STATUS.PENDING,
            payload: payload as object,
            result: null,
            error: null,
            retryCount: 0,
            maxRetry: options.maxRetry ?? JOB_DEFAULTS.MAX_RETRY,
            priority: options.priority ?? 0,
            triggeredBy: options.triggeredBy || null,
            startedAt: null,
            completedAt: null,
        },
    });

    // Add to in-memory queue
    const jobPayload: JobPayload = {
        jobId,
        tenantId,
        branchId,
        type,
        payload,
        triggeredBy: options.triggeredBy,
    };

    const queueName = getQueueName(type);
    if (!memoryQueue.has(queueName)) {
        memoryQueue.set(queueName, []);
    }

    // Handle delay
    if (options.delay && options.delay > 0) {
        setTimeout(() => {
            memoryQueue.get(queueName)?.push(jobPayload);
            logger.info(`Delayed job added to queue: ${jobId}`);
        }, options.delay);
    } else {
        memoryQueue.get(queueName)?.push(jobPayload);
    }

    logger.info(`Job enqueued: ${jobId} (${type})`);

    return jobRecord as unknown as JobRecord;
}

/**
 * Get next job from queue
 */
export function dequeue(queueName: string): JobPayload | undefined {
    const queue = memoryQueue.get(queueName);
    if (!queue || queue.length === 0) {
        return undefined;
    }
    // Sort by priority (higher first) and get first
    queue.sort((a, b) => (b.payload.priority as number || 0) - (a.payload.priority as number || 0));
    return queue.shift();
}

/**
 * Get queue length
 */
export function getQueueLength(queueName: string): number {
    return memoryQueue.get(queueName)?.length || 0;
}

/**
 * Get queue name for job type
 */
function getQueueName(type: JobType): string {
    switch (type) {
        case 'notification.delivery':
            return 'notifications';
        case 'report.generate':
            return 'reports';
        case 'fee.reminder':
            return 'reminders';
        default:
            return 'default';
    }
}

/**
 * Update job status in database
 */
export async function updateJobStatus(
    jobId: string,
    status: string,
    data: {
        result?: Record<string, unknown>;
        error?: string;
        retryCount?: number;
        startedAt?: Date;
        completedAt?: Date;
    } = {}
): Promise<void> {
    await prisma.job.update({
        where: { id: jobId },
        data: {
            status,
            ...(data.result && { result: data.result as object }),
            ...(data.error && { error: data.error }),
            ...(data.retryCount !== undefined && { retryCount: data.retryCount }),
            ...(data.startedAt && { startedAt: data.startedAt }),
            ...(data.completedAt && { completedAt: data.completedAt }),
            updatedAt: new Date(),
        },
    });
}

/**
 * Re-enqueue job for retry
 */
export async function requeue(job: JobPayload): Promise<void> {
    const queueName = getQueueName(job.type);
    if (!memoryQueue.has(queueName)) {
        memoryQueue.set(queueName, []);
    }
    memoryQueue.get(queueName)?.push(job);
    logger.info(`Job re-queued for retry: ${job.jobId}`);
}
