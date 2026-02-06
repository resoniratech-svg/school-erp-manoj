/**
 * Jobs Worker
 * Consumes and processes jobs from queues
 */
import { JOB_STATUS, QUEUE_NAME, JOB_DEFAULTS } from './jobs.constants';
import { dequeue, updateJobStatus, requeue } from './jobs.queue';
import { getProcessor } from './jobs.registry';
import { getDefaultJobsConfig } from './jobs.config';
import type { JobPayload, JobsConfig } from './jobs.types';
import { getLogger } from '../../utils/logger';

const logger = getLogger('jobs-worker');

// Worker state
let isRunning = false;
let processingCount = 0;

/**
 * Start the worker
 */
export function startWorker(config: JobsConfig = getDefaultJobsConfig()): void {
    if (isRunning) {
        logger.warn('Worker already running');
        return;
    }

    if (!config.enabled) {
        logger.info('Jobs are disabled, worker not started');
        return;
    }

    isRunning = true;
    logger.info('Worker started', { concurrency: config.concurrency });

    // Poll each queue
    const queues = Object.values(QUEUE_NAME);
    queues.forEach(queueName => {
        pollQueue(queueName, config);
    });
}

/**
 * Stop the worker
 */
export function stopWorker(): void {
    isRunning = false;
    logger.info('Worker stopped');
}

/**
 * Poll a queue for jobs
 */
async function pollQueue(queueName: string, config: JobsConfig): Promise<void> {
    if (!isRunning) return;

    // Check concurrency limit
    if (processingCount >= config.concurrency) {
        setTimeout(() => pollQueue(queueName, config), 100);
        return;
    }

    const job = dequeue(queueName);
    if (job) {
        processingCount++;
        processJob(job, config)
            .finally(() => {
                processingCount--;
            });
    }

    // Continue polling
    setTimeout(() => pollQueue(queueName, config), 100);
}

/**
 * Process a single job
 */
async function processJob(job: JobPayload, config: JobsConfig): Promise<void> {
    logger.info(`Processing job: ${job.jobId} (${job.type})`);

    // Update status to processing
    await updateJobStatus(job.jobId, JOB_STATUS.PROCESSING, {
        startedAt: new Date(),
    });

    // Get processor
    const processor = getProcessor(job.type);
    if (!processor) {
        logger.error(`No processor for job type: ${job.type}`);
        await updateJobStatus(job.jobId, JOB_STATUS.FAILED, {
            error: `No processor found for job type: ${job.type}`,
        });
        return;
    }

    try {
        // Execute processor (idempotent)
        const result = await processor.process(job);

        // Update status to completed
        await updateJobStatus(job.jobId, JOB_STATUS.COMPLETED, {
            result,
            completedAt: new Date(),
        });

        logger.info(`Job completed: ${job.jobId}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Job failed: ${job.jobId}`, { error: errorMessage });

        // Check retry count
        const retryCount = await getJobRetryCount(job.jobId);
        const maxRetry = config.maxRetry;

        if (retryCount < maxRetry) {
            // Schedule retry
            await updateJobStatus(job.jobId, JOB_STATUS.RETRYING, {
                error: errorMessage,
                retryCount: retryCount + 1,
            });

            // Backoff delay
            const delay = config.backoffSeconds * 1000 * Math.pow(2, retryCount);
            setTimeout(() => {
                requeue(job);
            }, delay);

            logger.info(`Job scheduled for retry: ${job.jobId} (attempt ${retryCount + 1}/${maxRetry})`);
        } else {
            // Max retries exceeded
            await updateJobStatus(job.jobId, JOB_STATUS.FAILED, {
                error: errorMessage,
                retryCount: retryCount,
            });

            logger.warn(`Job failed permanently: ${job.jobId} (max retries exceeded)`);
        }
    }
}

/**
 * Get job retry count from database
 */
async function getJobRetryCount(jobId: string): Promise<number> {
    // In production, fetch from database
    // For now, return 0
    return 0;
}

/**
 * Get worker status
 */
export function getWorkerStatus(): { running: boolean; processing: number } {
    return {
        running: isRunning,
        processing: processingCount,
    };
}
