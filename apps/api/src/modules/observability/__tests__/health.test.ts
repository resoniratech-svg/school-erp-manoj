/**
 * Health Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HEALTH_STATUS } from '../observability.constants';

// Mock database
vi.mock('@school-erp/database', () => ({
    prisma: {
        $queryRaw: vi.fn(),
    },
}));

// Mock jobs module
vi.mock('../../jobs', () => ({
    getWorkerStatus: vi.fn().mockReturnValue({ running: true, processing: 0 }),
}));

import { prisma } from '@school-erp/database';
import { getWorkerStatus } from '../../jobs';

describe('Health Checks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('healthy status', () => {
        it('should return healthy when all components are up', async () => {
            (prisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue([{ result: 1 }]);
            (getWorkerStatus as ReturnType<typeof vi.fn>).mockReturnValue({ running: true, processing: 0 });

            // Import fresh to avoid caching
            const { getHealth } = await import('../observability.health');
            const health = await getHealth(true);

            expect(health.status).toBe(HEALTH_STATUS.HEALTHY);
            expect(health.components.find(c => c.name === 'database')?.status).toBe(HEALTH_STATUS.HEALTHY);
        });
    });

    describe('degraded status', () => {
        it('should return degraded when workers are down', async () => {
            (prisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue([{ result: 1 }]);
            (getWorkerStatus as ReturnType<typeof vi.fn>).mockReturnValue({ running: false, processing: 0 });

            const { getHealth } = await import('../observability.health');
            const health = await getHealth(true);

            expect(health.status).toBe(HEALTH_STATUS.DEGRADED);
        });
    });

    describe('unhealthy status', () => {
        it('should return unhealthy when database is down', async () => {
            (prisma.$queryRaw as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Connection refused'));

            const { getHealth } = await import('../observability.health');
            const health = await getHealth(true);

            expect(health.status).toBe(HEALTH_STATUS.UNHEALTHY);
            expect(health.components.find(c => c.name === 'database')?.status).toBe(HEALTH_STATUS.UNHEALTHY);
        });
    });

    describe('readiness check', () => {
        it('should return not ready when database is down', async () => {
            (prisma.$queryRaw as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Connection refused'));

            const { getReadiness } = await import('../observability.health');
            const readiness = await getReadiness();

            expect(readiness.ready).toBe(false);
            expect(readiness.checks.database).toBe(false);
        });

        it('should return ready when database is healthy', async () => {
            (prisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue([{ result: 1 }]);

            const { getReadiness } = await import('../observability.health');
            const readiness = await getReadiness();

            expect(readiness.ready).toBe(true);
            expect(readiness.checks.database).toBe(true);
        });
    });

    describe('liveness check', () => {
        it('should always return alive', async () => {
            const { getLiveness } = await import('../observability.health');
            const liveness = getLiveness();

            expect(liveness.alive).toBe(true);
        });
    });
});
