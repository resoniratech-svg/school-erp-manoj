/**
 * Jobs Metrics Collector
 * Queue and worker metrics
 */
import { incCounter, setGauge } from '../observability.metrics';
import { METRIC_NAME } from '../observability.constants';
import { getQueueLength } from '../../jobs/jobs.queue';
import { getWorkerStatus } from '../../jobs/jobs.worker';

// Worker start time for uptime calculation
let workerStartTime: number | null = null;

/**
 * Record job queued
 */
export function recordJobQueued(type: string, queue: string): void {
    incCounter(METRIC_NAME.JOBS_QUEUED_TOTAL, { type, queue });
}

/**
 * Record job processed
 */
export function recordJobProcessed(type: string, queue: string): void {
    incCounter(METRIC_NAME.JOBS_PROCESSED_TOTAL, { type, queue });
}

/**
 * Record job failed
 */
export function recordJobFailed(type: string, queue: string): void {
    incCounter(METRIC_NAME.JOBS_FAILED_TOTAL, { type, queue });
}

/**
 * Record job retry
 */
export function recordJobRetry(type: string, queue: string): void {
    incCounter(METRIC_NAME.JOBS_RETRY_TOTAL, { type, queue });
}

/**
 * Update queue size gauge
 */
export function updateQueueSize(queue: string, size: number): void {
    setGauge(METRIC_NAME.JOBS_QUEUE_SIZE, size, { queue });
}

/**
 * Set worker start time
 */
export function setWorkerStartTime(): void {
    workerStartTime = Date.now();
}

/**
 * Collect jobs metrics snapshot
 */
export function collectJobsMetrics(): {
    queued: Record<string, number>;
    workerUptime: number;
    workerRunning: boolean;
    processing: number;
} {
    const queues = ['default', 'notifications', 'reports', 'reminders'];
    const queued: Record<string, number> = {};

    for (const queue of queues) {
        const size = getQueueLength(queue);
        queued[queue] = size;
        updateQueueSize(queue, size);
    }

    const status = getWorkerStatus();
    const uptime = workerStartTime ? (Date.now() - workerStartTime) / 1000 : 0;

    setGauge(METRIC_NAME.WORKER_UPTIME_SECONDS, uptime);

    return {
        queued,
        workerUptime: uptime,
        workerRunning: status.running,
        processing: status.processing,
    };
}
