/**
 * Observability Service
 * Aggregates metrics and status
 */
import {
    exportPrometheusMetrics,
    getCounter,
    getHistogram,
    calculatePercentile,
    setGauge,
} from './observability.metrics';
import { getHealth, getLiveness, getReadiness, getUptime } from './observability.health';
import { collectJobsMetrics } from './collectors';
import { METRIC_NAME } from './observability.constants';
import type { SystemStatus, HealthCheckResponse, ReadinessResponse } from './observability.types';

export class ObservabilityService {
    /**
     * Get Prometheus-formatted metrics
     */
    getMetrics(): string {
        // Update system metrics before export
        this.updateSystemMetrics();

        return exportPrometheusMetrics();
    }

    /**
     * Get health check
     */
    async getHealth(): Promise<HealthCheckResponse> {
        return getHealth();
    }

    /**
     * Get liveness
     */
    getLiveness(): { alive: boolean } {
        return getLiveness();
    }

    /**
     * Get readiness
     */
    async getReadiness(): Promise<ReadinessResponse> {
        return getReadiness();
    }

    /**
     * Get system status overview
     */
    async getStatus(): Promise<SystemStatus> {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const uptime = getUptime();

        // Get request metrics
        const totalRequests = this.sumCounters(METRIC_NAME.HTTP_REQUEST_TOTAL);
        const totalErrors = this.sumCounters(METRIC_NAME.HTTP_ERROR_TOTAL);

        // Get jobs metrics
        const jobsMetrics = collectJobsMetrics();
        const jobsQueued = Object.values(jobsMetrics.queued).reduce((a, b) => a + b, 0);
        const jobsProcessed = this.sumCounters(METRIC_NAME.JOBS_PROCESSED_TOTAL);
        const jobsFailed = this.sumCounters(METRIC_NAME.JOBS_FAILED_TOTAL);

        return {
            uptime,
            memory: {
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                rss: memoryUsage.rss,
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system,
            },
            requests: {
                total: totalRequests,
                perSecond: uptime > 0 ? totalRequests / uptime : 0,
            },
            errors: {
                total: totalErrors,
                rate: totalRequests > 0 ? totalErrors / totalRequests : 0,
            },
            jobs: {
                queued: jobsQueued,
                processed: jobsProcessed,
                failed: jobsFailed,
            },
        };
    }

    /**
     * Get latency percentiles
     */
    getLatencyPercentiles(): { p50: number; p95: number; p99: number } | null {
        const histogram = getHistogram(METRIC_NAME.HTTP_REQUEST_DURATION);
        if (!histogram) return null;

        return {
            p50: calculatePercentile(histogram, 50),
            p95: calculatePercentile(histogram, 95),
            p99: calculatePercentile(histogram, 99),
        };
    }

    /**
     * Update system metrics gauges
     */
    private updateSystemMetrics(): void {
        const memoryUsage = process.memoryUsage();
        setGauge(METRIC_NAME.PROCESS_MEMORY_HEAP, memoryUsage.heapUsed);
        setGauge(METRIC_NAME.PROCESS_UPTIME, getUptime());
    }

    /**
     * Sum all counter values (across all label combinations)
     */
    private sumCounters(metricName: string): number {
        // For simplicity, get base counter
        return getCounter(metricName);
    }
}

export const observabilityService = new ObservabilityService();
