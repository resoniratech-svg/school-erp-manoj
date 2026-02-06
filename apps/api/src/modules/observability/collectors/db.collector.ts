/**
 * Database Metrics Collector
 * Query timing and connection pool metrics
 */
import { incCounter, observeHistogram, setGauge } from '../observability.metrics';
import { METRIC_NAME, SLOW_QUERY_THRESHOLD_MS } from '../observability.constants';

/**
 * Record query execution time
 */
export function recordQueryDuration(
    duration: number,
    operation: string,
    table: string
): void {
    const labels = { operation, table };

    // Observe query duration (convert ms to seconds)
    observeHistogram(METRIC_NAME.DB_QUERY_DURATION, duration / 1000, labels);

    // Track slow queries
    if (duration >= SLOW_QUERY_THRESHOLD_MS) {
        incCounter(METRIC_NAME.DB_SLOW_QUERIES_TOTAL, labels);
    }
}

/**
 * Update connection pool metrics
 */
export function updatePoolMetrics(poolSize: number, activeConnections: number): void {
    setGauge(METRIC_NAME.DB_POOL_SIZE, poolSize);
    setGauge(METRIC_NAME.DB_POOL_ACTIVE, activeConnections);
}

/**
 * Create Prisma middleware for query timing
 */
export function createPrismaMetricsMiddleware() {
    return async (params: { model?: string; action: string }, next: (params: unknown) => Promise<unknown>) => {
        const start = Date.now();
        const result = await next(params);
        const duration = Date.now() - start;

        recordQueryDuration(
            duration,
            params.action,
            params.model || 'unknown'
        );

        return result;
    };
}
