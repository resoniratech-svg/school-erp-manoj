/**
 * Observability Constants
 * Metrics, health checks, and monitoring
 */
import { createPermission } from '@school-erp/shared';

// Permissions
export const OBSERVABILITY_PERMISSIONS = {
    READ: createPermission('observability', 'read', 'tenant'),
} as const;

// Health Status
export const HEALTH_STATUS = {
    HEALTHY: 'healthy',
    DEGRADED: 'degraded',
    UNHEALTHY: 'unhealthy',
} as const;

// Metric Names
export const METRIC_NAME = {
    // HTTP
    HTTP_REQUEST_TOTAL: 'http_requests_total',
    HTTP_REQUEST_DURATION: 'http_request_duration_seconds',
    HTTP_ERROR_TOTAL: 'http_errors_total',

    // Jobs
    JOBS_QUEUED_TOTAL: 'jobs_queued_total',
    JOBS_PROCESSED_TOTAL: 'jobs_processed_total',
    JOBS_FAILED_TOTAL: 'jobs_failed_total',
    JOBS_RETRY_TOTAL: 'jobs_retry_total',
    JOBS_QUEUE_SIZE: 'jobs_queue_size',
    WORKER_UPTIME_SECONDS: 'worker_uptime_seconds',

    // Database
    DB_QUERY_DURATION: 'db_query_duration_seconds',
    DB_POOL_SIZE: 'db_pool_size',
    DB_POOL_ACTIVE: 'db_pool_active_connections',
    DB_SLOW_QUERIES_TOTAL: 'db_slow_queries_total',

    // System
    PROCESS_UPTIME: 'process_uptime_seconds',
    PROCESS_MEMORY_HEAP: 'process_memory_heap_bytes',
} as const;

// Percentile Buckets
export const LATENCY_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10] as const;

// Slow Query Threshold (ms)
export const SLOW_QUERY_THRESHOLD_MS = 1000;

// Health Check Interval (ms)
export const HEALTH_CHECK_INTERVAL_MS = 30000;
