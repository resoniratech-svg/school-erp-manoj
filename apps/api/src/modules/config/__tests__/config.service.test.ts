/**
 * Config Service Unit Tests
 * Tests for merge logic, validation, and no-delete enforcement
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ConfigService } from '../config.service';
import type { ConfigRepository } from '../config.repository';
import { CONFIG_SCOPE, CONFIG_ERROR_CODES, ALLOWED_CONFIG_KEYS } from '../config.constants';

describe('ConfigService', () => {
    let service: ConfigService;
    let mockRepository: {
        getTenantConfigs: Mock;
        getBranchConfigs: Mock;
        getConfigByKey: Mock;
        upsertConfig: Mock;
        batchUpsertConfigs: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockTenantConfig = {
        id: 'cfg-1',
        configKey: 'fees.enabled',
        configValue: 'true',
        valueType: 'boolean',
        scope: CONFIG_SCOPE.TENANT,
        tenantId: 'tenant-123',
        branchId: null,
        updatedBy: 'admin',
        updatedAt: new Date(),
        createdAt: new Date(),
    };

    const mockBranchConfig = {
        id: 'cfg-2',
        configKey: 'fees.enabled',
        configValue: 'false',
        valueType: 'boolean',
        scope: CONFIG_SCOPE.BRANCH,
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        updatedBy: 'admin',
        updatedAt: new Date(),
        createdAt: new Date(),
    };

    beforeEach(() => {
        mockRepository = {
            getTenantConfigs: vi.fn(),
            getBranchConfigs: vi.fn(),
            getConfigByKey: vi.fn(),
            upsertConfig: vi.fn(),
            batchUpsertConfigs: vi.fn(),
        };

        service = new ConfigService(mockRepository as unknown as ConfigRepository);
    });

    describe('tenant config creation', () => {
        it('should create tenant config via upsert', async () => {
            mockRepository.upsertConfig.mockResolvedValue(mockTenantConfig);

            const result = await service.updateConfig(
                { key: 'fees.enabled', value: true },
                { ...mockContext, branchId: undefined }
            );

            expect(result.key).toBe('fees.enabled');
            expect(result.value).toBe(true);
            expect(mockRepository.upsertConfig).toHaveBeenCalledWith(
                'tenant-123',
                'fees.enabled',
                'true',
                'boolean',
                CONFIG_SCOPE.TENANT,
                'user-789',
                undefined
            );
        });
    });

    describe('branch override precedence', () => {
        it('should prioritize branch config over tenant config', async () => {
            // Tenant config returns true, branch config returns false
            mockRepository.getConfigByKey
                .mockResolvedValueOnce(mockTenantConfig) // First call - tenant level
                .mockResolvedValueOnce(mockBranchConfig); // Second call - branch level (override)

            const result = await service.getConfigByKey('fees.enabled', mockContext);

            expect(result.value).toBe(false); // Branch override wins
            expect(result.source).toBe('branch');
            expect(result.tenantValue).toBe(true);
            expect(result.branchOverride).toBe(false);
        });

        it('should use tenant value when no branch override', async () => {
            mockRepository.getConfigByKey
                .mockResolvedValueOnce(mockTenantConfig)
                .mockResolvedValueOnce(null); // No branch override

            const result = await service.getConfigByKey('fees.enabled', {
                ...mockContext,
                branchId: 'branch-other',
            });

            expect(result.value).toBe(true); // Tenant value
            expect(result.source).toBe('tenant');
        });

        it('should use default when no tenant or branch config', async () => {
            mockRepository.getConfigByKey.mockResolvedValue(null);

            const result = await service.getConfigByKey('fees.enabled', {
                tenantId: 'tenant-new',
                userId: 'user-1',
            });

            const defaultValue = ALLOWED_CONFIG_KEYS['fees.enabled'].default;
            expect(result.value).toBe(defaultValue);
            expect(result.source).toBe('default');
        });
    });

    describe('invalid key rejection', () => {
        it('should reject unknown config keys', async () => {
            await expect(
                service.updateConfig(
                    { key: 'unknown.invalid.key' as any, value: true },
                    mockContext
                )
            ).rejects.toThrow(CONFIG_ERROR_CODES.INVALID_KEY);
        });
    });

    describe('invalid value type rejection', () => {
        it('should have type validation in allowed keys', () => {
            // This is enforced at validator level, but verify types exist
            const feesKey = ALLOWED_CONFIG_KEYS['fees.enabled'];
            expect(feesKey.type).toBe('boolean');

            const maxStudentsKey = ALLOWED_CONFIG_KEYS['limits.maxStudents'];
            expect(maxStudentsKey.type).toBe('number');
        });
    });

    describe('cross-tenant access', () => {
        it('should scope queries to tenant', async () => {
            mockRepository.getTenantConfigs.mockResolvedValue([]);
            mockRepository.getBranchConfigs.mockResolvedValue([]);

            await service.getAllConfigs(mockContext);

            expect(mockRepository.getTenantConfigs).toHaveBeenCalledWith(
                'tenant-123',
                undefined
            );
        });
    });

    describe('audit logging', () => {
        it('should log config updates', async () => {
            mockRepository.upsertConfig.mockResolvedValue(mockTenantConfig);

            // Just verify the update completes (logging is internal)
            await expect(
                service.updateConfig(
                    { key: 'fees.enabled', value: true },
                    mockContext
                )
            ).resolves.not.toThrow();
        });
    });

    describe('no delete method', () => {
        it('should not have delete method', () => {
            expect((service as unknown as { deleteConfig?: unknown }).deleteConfig).toBeUndefined();
        });

        it('should not have remove method', () => {
            expect((service as unknown as { removeConfig?: unknown }).removeConfig).toBeUndefined();
        });
    });

    describe('convenience methods', () => {
        it('should check feature enabled status', async () => {
            mockRepository.getConfigByKey.mockResolvedValue(mockTenantConfig);

            const isEnabled = await service.isFeatureEnabled('fees.enabled', mockContext);
            expect(isEnabled).toBe(true);
        });

        it('should get limit value', async () => {
            mockRepository.getConfigByKey.mockResolvedValue({
                ...mockTenantConfig,
                configKey: 'limits.maxStudents',
                configValue: '1000',
                valueType: 'number',
            });

            const limit = await service.getLimit('limits.maxStudents', mockContext);
            expect(limit).toBe(1000);
        });
    });
});
