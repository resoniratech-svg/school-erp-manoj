/**
 * Usage Service Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsageService } from '../usage.service';
import { USAGE_METRICS } from '../usage.constants';

// Mock repository
const mockRepository = {
    append: vi.fn(),
    getAggregatedUsage: vi.fn(),
    getAggregatedUsageAll: vi.fn(),
    getEvents: vi.fn(),
};

// Mock config service
vi.mock('../../config/config.service', () => ({
    configService: {
        getLimit: vi.fn().mockResolvedValue(100),
    },
}));

describe('UsageService', () => {
    let service: UsageService;
    const tenantId = 'tenant-123';
    const context = { tenantId, userId: 'user-123' };

    beforeEach(() => {
        vi.clearAllMocks();
        service = new UsageService(mockRepository as never);
    });

    describe('increment', () => {
        it('should append positive delta', async () => {
            await service.increment(tenantId, USAGE_METRICS.STUDENTS, 1, {
                source: 'students.create',
                entityId: 'student-123',
            });

            expect(mockRepository.append).toHaveBeenCalledWith({
                tenantId,
                metric: USAGE_METRICS.STUDENTS,
                delta: 1,
                source: 'students.create',
                entityId: 'student-123',
            });
        });

        it('should append negative delta for deletion', async () => {
            await service.increment(tenantId, USAGE_METRICS.STUDENTS, -1, {
                source: 'students.delete',
                entityId: 'student-123',
            });

            expect(mockRepository.append).toHaveBeenCalledWith({
                tenantId,
                metric: USAGE_METRICS.STUDENTS,
                delta: -1,
                source: 'students.delete',
                entityId: 'student-123',
            });
        });

        it('should handle large deltas (storage)', async () => {
            await service.increment(tenantId, USAGE_METRICS.STORAGE_MB, 500, {
                source: 'files.upload',
            });

            expect(mockRepository.append).toHaveBeenCalledWith(
                expect.objectContaining({
                    delta: 500,
                    metric: USAGE_METRICS.STORAGE_MB,
                })
            );
        });
    });

    describe('getUsage', () => {
        it('should return aggregated usage', async () => {
            mockRepository.getAggregatedUsage.mockResolvedValue(45);

            const result = await service.getUsage(tenantId, USAGE_METRICS.STUDENTS);

            expect(result).toBe(45);
            expect(mockRepository.getAggregatedUsage).toHaveBeenCalledWith(
                tenantId,
                USAGE_METRICS.STUDENTS
            );
        });

        it('should return 0 for no usage', async () => {
            mockRepository.getAggregatedUsage.mockResolvedValue(0);

            const result = await service.getUsage(tenantId, USAGE_METRICS.STUDENTS);

            expect(result).toBe(0);
        });
    });

    describe('getUsageSummary', () => {
        it('should return summary of all metrics', async () => {
            mockRepository.getAggregatedUsageAll.mockResolvedValue({
                students: 45,
                staff: 10,
                branches: 2,
                storage_mb: 1024,
                notifications: 500,
            });

            const result = await service.getUsageSummary(tenantId);

            expect(result).toEqual({
                students: 45,
                staff: 10,
                branches: 2,
                storage_mb: 1024,
                notifications: 500,
            });
        });

        it('should return 0 for missing metrics', async () => {
            mockRepository.getAggregatedUsageAll.mockResolvedValue({
                students: 45,
            });

            const result = await service.getUsageSummary(tenantId);

            expect(result.students).toBe(45);
            expect(result.staff).toBe(0);
            expect(result.branches).toBe(0);
        });
    });

    describe('isAtLimit', () => {
        it('should return true when at limit', async () => {
            mockRepository.getAggregatedUsage.mockResolvedValue(100);

            const result = await service.isAtLimit(tenantId, USAGE_METRICS.STUDENTS, context);

            expect(result).toBe(true);
        });

        it('should return false when under limit', async () => {
            mockRepository.getAggregatedUsage.mockResolvedValue(50);

            const result = await service.isAtLimit(tenantId, USAGE_METRICS.STUDENTS, context);

            expect(result).toBe(false);
        });
    });

    describe('tenant isolation', () => {
        it('should query with correct tenant ID', async () => {
            mockRepository.getAggregatedUsage.mockResolvedValue(10);

            await service.getUsage('tenant-A', USAGE_METRICS.STUDENTS);
            await service.getUsage('tenant-B', USAGE_METRICS.STUDENTS);

            expect(mockRepository.getAggregatedUsage).toHaveBeenNthCalledWith(
                1,
                'tenant-A',
                USAGE_METRICS.STUDENTS
            );
            expect(mockRepository.getAggregatedUsage).toHaveBeenNthCalledWith(
                2,
                'tenant-B',
                USAGE_METRICS.STUDENTS
            );
        });
    });
});
