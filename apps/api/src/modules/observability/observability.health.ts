/**
 * Health Checks
 * Liveness, readiness, and component health
 */
import { prisma } from '@school-erp/database';
import { HEALTH_STATUS } from './observability.constants';
import type { HealthStatus, ComponentHealth, HealthCheckResponse, ReadinessResponse } from './observability.types';
import { getWorkerStatus } from '../jobs';

// Application start time
const startTime = Date.now();

// Cached health status
let cachedHealth: HealthCheckResponse | null = null;
let lastHealthCheck = 0;
const CACHE_DURATION_MS = 5000;

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        return {
            name: 'database',
            status: HEALTH_STATUS.HEALTHY,
            latencyMs: Date.now() - start,
        };
    } catch (error) {
        return {
            name: 'database',
            status: HEALTH_STATUS.UNHEALTHY,
            latencyMs: Date.now() - start,
            message: error instanceof Error ? error.message : 'Database check failed',
        };
    }
}

/**
 * Check Redis health (placeholder)
 */
async function checkRedisHealth(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
        // TODO: Implement actual Redis health check
        // await redis.ping();
        return {
            name: 'redis',
            status: HEALTH_STATUS.HEALTHY,
            latencyMs: Date.now() - start,
        };
    } catch (error) {
        return {
            name: 'redis',
            status: HEALTH_STATUS.DEGRADED,
            latencyMs: Date.now() - start,
            message: 'Redis unavailable (graceful degradation)',
        };
    }
}

/**
 * Check worker health
 */
function checkWorkerHealth(): ComponentHealth {
    const status = getWorkerStatus();
    return {
        name: 'workers',
        status: status.running ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.DEGRADED,
        message: status.running ? `Processing ${status.processing} jobs` : 'Workers not running',
    };
}

/**
 * Get overall health status
 */
function deriveOverallStatus(components: ComponentHealth[]): HealthStatus {
    const hasUnhealthy = components.some(c => c.status === HEALTH_STATUS.UNHEALTHY);
    const hasDegraded = components.some(c => c.status === HEALTH_STATUS.DEGRADED);

    if (hasUnhealthy) return HEALTH_STATUS.UNHEALTHY;
    if (hasDegraded) return HEALTH_STATUS.DEGRADED;
    return HEALTH_STATUS.HEALTHY;
}

/**
 * Full health check
 */
export async function getHealth(skipCache = false): Promise<HealthCheckResponse> {
    const now = Date.now();

    // Return cached if fresh
    if (!skipCache && cachedHealth && (now - lastHealthCheck) < CACHE_DURATION_MS) {
        return cachedHealth;
    }

    const components = await Promise.all([
        checkDatabaseHealth(),
        checkRedisHealth(),
        Promise.resolve(checkWorkerHealth()),
    ]);

    cachedHealth = {
        status: deriveOverallStatus(components),
        timestamp: new Date(),
        uptime: (now - startTime) / 1000,
        version: process.env.APP_VERSION || '1.0.0',
        components,
    };

    lastHealthCheck = now;
    return cachedHealth;
}

/**
 * Liveness check (simple)
 */
export function getLiveness(): { alive: boolean } {
    return { alive: true };
}

/**
 * Readiness check
 */
export async function getReadiness(): Promise<ReadinessResponse> {
    const health = await getHealth(true);

    const dbHealthy = health.components.find(c => c.name === 'database')?.status === HEALTH_STATUS.HEALTHY;
    const redisHealthy = health.components.find(c => c.name === 'redis')?.status !== HEALTH_STATUS.UNHEALTHY;
    const workersHealthy = health.components.find(c => c.name === 'workers')?.status !== HEALTH_STATUS.UNHEALTHY;

    return {
        ready: dbHealthy, // Database is required for readiness
        checks: {
            database: dbHealthy,
            redis: redisHealthy,
            workers: workersHealthy,
        },
    };
}

/**
 * Get uptime in seconds
 */
export function getUptime(): number {
    return (Date.now() - startTime) / 1000;
}
