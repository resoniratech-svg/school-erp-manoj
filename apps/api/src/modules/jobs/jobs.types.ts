/**
 * Background Jobs Types
 */

// Job Type
export type JobType = 'notification.delivery' | 'report.generate' | 'fee.reminder';

// Job Status
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

// Job Payload (standard structure)
export interface JobPayload {
    jobId: string;
    tenantId: string;
    branchId?: string;
    type: JobType;
    payload: Record<string, unknown>;
    triggeredBy?: string;
}

// Job Record (database representation)
export interface JobRecord {
    id: string;
    tenantId: string;
    branchId: string | null;
    type: JobType;
    status: JobStatus;
    payload: Record<string, unknown>;
    result: Record<string, unknown> | null;
    error: string | null;
    retryCount: number;
    maxRetry: number;
    priority: number;
    triggeredBy: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

// Job Response (API)
export interface JobResponse {
    id: string;
    tenantId: string;
    branchId: string | null;
    type: JobType;
    status: JobStatus;
    retryCount: number;
    maxRetry: number;
    error: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
}

// Job List Response
export interface JobListResponse {
    jobs: JobResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

// Enqueue Input
export interface EnqueueJobInput {
    type: JobType;
    payload: Record<string, unknown>;
    priority?: number;
    delay?: number; // delay in milliseconds
}

// Context
export interface JobContext {
    tenantId: string;
    branchId?: string;
    userId: string;
}

// Processor Interface
export interface IJobProcessor {
    process(job: JobPayload): Promise<Record<string, unknown>>;
}

// Job Config
export interface JobsConfig {
    enabled: boolean;
    concurrency: number;
    maxRetry: number;
    backoffSeconds: number;
}
