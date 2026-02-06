/**
 * Observability Types
 */

// Health Status
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

// Component Health
export interface ComponentHealth {
    name: string;
    status: HealthStatus;
    latencyMs?: number;
    message?: string;
}

// Health Check Response
export interface HealthCheckResponse {
    status: HealthStatus;
    timestamp: Date;
    uptime: number;
    version: string;
    components: ComponentHealth[];
}

// Readiness Response
export interface ReadinessResponse {
    ready: boolean;
    checks: {
        database: boolean;
        redis: boolean;
        workers: boolean;
    };
}

// Metric Entry
export interface MetricEntry {
    name: string;
    help: string;
    type: 'counter' | 'gauge' | 'histogram' | 'summary';
    value: number | Record<string, number>;
    labels?: Record<string, string>;
}

// HTTP Metric Labels
export interface HttpMetricLabels {
    method: string;
    path: string;
    statusCode: string;
}

// Job Metric Labels
export interface JobMetricLabels {
    type: string;
    queue: string;
}

// Db Metric Labels
export interface DbMetricLabels {
    operation: string;
    table: string;
}

// Histogram Data
export interface HistogramData {
    count: number;
    sum: number;
    buckets: Map<number, number>;
}

// System Status
export interface SystemStatus {
    uptime: number;
    memory: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
    };
    cpu: {
        user: number;
        system: number;
    };
    requests: {
        total: number;
        perSecond: number;
    };
    errors: {
        total: number;
        rate: number;
    };
    jobs: {
        queued: number;
        processed: number;
        failed: number;
    };
}
