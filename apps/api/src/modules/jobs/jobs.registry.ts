/**
 * Jobs Registry
 * Central processor mapping
 */
import type { JobType, IJobProcessor } from './jobs.types';
import { JOB_TYPE, JOBS_ERROR_CODES } from './jobs.constants';

// Processor registry
const processors = new Map<JobType, IJobProcessor>();

/**
 * Register a processor for a job type
 */
export function registerProcessor(type: JobType, processor: IJobProcessor): void {
    processors.set(type, processor);
}

/**
 * Get processor for job type
 */
export function getProcessor(type: JobType): IJobProcessor | undefined {
    return processors.get(type);
}

/**
 * Check if processor exists
 */
export function hasProcessor(type: JobType): boolean {
    return processors.has(type);
}

/**
 * Get all registered job types
 */
export function getRegisteredTypes(): JobType[] {
    return Array.from(processors.keys());
}

/**
 * Initialize default processors
 * Called at application startup
 */
export async function initializeProcessors(): Promise<void> {
    // Import processors dynamically to avoid circular dependencies
    const { notificationProcessor } = await import('./processors/notification.processor');
    const { reportProcessor } = await import('./processors/report.processor');
    const { feeReminderProcessor } = await import('./processors/fee-reminder.processor');

    registerProcessor(JOB_TYPE.NOTIFICATION_DELIVERY, notificationProcessor);
    registerProcessor(JOB_TYPE.REPORT_GENERATE, reportProcessor);
    registerProcessor(JOB_TYPE.FEE_REMINDER, feeReminderProcessor);
}
