/**
 * Jobs Service
 * Internal enqueue and status APIs
 */
import { NotFoundError, ForbiddenError } from '@school-erp/shared';
import { prisma } from '@school-erp/database';
import { enqueue, updateJobStatus } from './jobs.queue';
import { getJobsConfig } from './jobs.config';
import { JOB_STATUS, JOBS_ERROR_CODES } from './jobs.constants';
import type {
    JobResponse,
    JobListResponse,
    EnqueueJobInput,
    JobContext,
    JobRecord,
} from './jobs.types';
import { getLogger } from '../../utils/logger';

const logger = getLogger('jobs-service');

export class JobsService {
    /**
     * Enqueue a job (internal use only)
     */
    async enqueueJob(input: EnqueueJobInput, context: JobContext): Promise<JobResponse> {
        // Check if jobs are enabled
        const config = await getJobsConfig(context);
        if (!config.enabled) {
            throw new ForbiddenError(JOBS_ERROR_CODES.JOBS_DISABLED);
        }

        const job = await enqueue(
            context.tenantId,
            context.branchId,
            input.type,
            input.payload,
            {
                priority: input.priority,
                delay: input.delay,
                maxRetry: config.maxRetry,
                triggeredBy: context.userId,
            }
        );

        logger.info(`Job enqueued: ${job.id} (${input.type}) by ${context.userId}`);

        return this.mapJobToResponse(job);
    }

    /**
     * Get job by ID
     */
    async getJobById(id: string, context: JobContext): Promise<JobResponse> {
        const job = await prisma.job.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
            },
        });

        if (!job) {
            throw new NotFoundError(JOBS_ERROR_CODES.JOB_NOT_FOUND);
        }

        return this.mapJobToResponse(job as unknown as JobRecord);
    }

    /**
     * List jobs with filters
     */
    async listJobs(
        filters: {
            type?: string;
            status?: string;
            page?: number;
            limit?: number;
        },
        context: JobContext
    ): Promise<JobListResponse> {
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 50, 100);
        const skip = (page - 1) * limit;

        const where = {
            tenantId: context.tenantId,
            ...(filters.type && { type: filters.type }),
            ...(filters.status && { status: filters.status }),
        };

        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.job.count({ where }),
        ]);

        return {
            jobs: jobs.map(j => this.mapJobToResponse(j as unknown as JobRecord)),
            pagination: { page, limit, total },
        };
    }

    /**
     * Retry a failed job
     */
    async retryJob(id: string, context: JobContext): Promise<JobResponse> {
        const job = await prisma.job.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
            },
        });

        if (!job) {
            throw new NotFoundError(JOBS_ERROR_CODES.JOB_NOT_FOUND);
        }

        // Check if retryable
        if (job.status !== JOB_STATUS.FAILED) {
            throw new ForbiddenError(`Job is not in failed state: ${job.status}`);
        }

        const config = await getJobsConfig(context);
        if (job.retryCount >= config.maxRetry) {
            throw new ForbiddenError(JOBS_ERROR_CODES.MAX_RETRIES_EXCEEDED);
        }

        // Reset to pending for retry
        await updateJobStatus(id, JOB_STATUS.PENDING, {
            retryCount: job.retryCount + 1,
        });

        // Re-enqueue
        await enqueue(
            job.tenantId,
            job.branchId || undefined,
            job.type as EnqueueJobInput['type'],
            job.payload as Record<string, unknown>,
            {
                maxRetry: config.maxRetry,
                triggeredBy: context.userId,
            }
        );

        logger.info(`Job retry initiated: ${id} by ${context.userId}`);

        const updated = await prisma.job.findUnique({ where: { id } });
        return this.mapJobToResponse(updated as unknown as JobRecord);
    }

    /**
     * Map job record to response
     */
    private mapJobToResponse(job: JobRecord): JobResponse {
        return {
            id: job.id,
            tenantId: job.tenantId,
            branchId: job.branchId,
            type: job.type,
            status: job.status,
            retryCount: job.retryCount,
            maxRetry: job.maxRetry,
            error: job.error,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            createdAt: job.createdAt,
        };
    }
}

export const jobsService = new JobsService();
