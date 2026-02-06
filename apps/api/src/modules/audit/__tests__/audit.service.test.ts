/**
 * Audit Service Unit Tests
 * Tests for read-only access, masking, pagination, and tenant isolation
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { AuditService } from '../audit.service';
import type { AuditRepository } from '../audit.repository';
import { AUDIT_ERROR_CODES, MASK_PATTERN } from '../audit.constants';
import { mapAuditLogToResponse } from '../audit.mapper';

describe('AuditService', () => {
    let service: AuditService;
    let mockRepository: {
        findById: Mock;
        findLogs: Mock;
        getDistinctModules: Mock;
        getDistinctEntities: Mock;
        getDistinctActions: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockAuditLog = {
        id: 'log-1',
        module: 'users',
        entity: 'User',
        entityId: 'user-456',
        action: 'create',
        userId: 'user-789',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        changes: {
            email: 'test@example.com',
            password: 'secret123', // Should be masked
        },
        metadata: {
            source: 'api',
            token: 'jwt-token-here', // Should be masked
        },
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        createdAt: new Date(),
        user: {
            id: 'user-789',
            email: 'admin@school.com',
            firstName: 'Admin',
            lastName: 'User',
        },
    };

    beforeEach(() => {
        mockRepository = {
            findById: vi.fn(),
            findLogs: vi.fn(),
            getDistinctModules: vi.fn(),
            getDistinctEntities: vi.fn(),
            getDistinctActions: vi.fn(),
        };

        service = new AuditService(mockRepository as unknown as AuditRepository);
    });

    describe('getLogById', () => {
        it('should return log with masked sensitive data', async () => {
            mockRepository.findById.mockResolvedValue(mockAuditLog);

            const result = await service.getLogById('log-1', mockContext);

            expect(result.id).toBe('log-1');
            expect(result.changes?.password).toBe(MASK_PATTERN);
            expect(result.metadata?.token).toBe(MASK_PATTERN);
            expect(result.changes?.email).toBe('test@example.com'); // Not masked
        });
    });

    describe('listLogs - pagination', () => {
        it('should return paginated results', async () => {
            mockRepository.findLogs.mockResolvedValue({
                logs: [mockAuditLog],
                total: 100,
            });

            const result = await service.listLogs(
                { page: 2, limit: 10 },
                mockContext
            );

            expect(result.pagination.page).toBe(2);
            expect(result.pagination.limit).toBe(10);
            expect(result.pagination.total).toBe(100);
            expect(result.pagination.totalPages).toBe(10);
        });

        it('should apply max limit', async () => {
            mockRepository.findLogs.mockResolvedValue({
                logs: [],
                total: 0,
            });

            await service.listLogs(
                { limit: 500 }, // Over max
                mockContext
            );

            expect(mockRepository.findLogs).toHaveBeenCalledWith(
                'tenant-123',
                'branch-456',
                expect.objectContaining({ limit: 100 }) // Capped at max
            );
        });
    });

    describe('cross-tenant rejection', () => {
        it('should reject log from different tenant', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(
                service.getLogById('log-other', mockContext)
            ).rejects.toThrow(AUDIT_ERROR_CODES.LOG_NOT_FOUND);
        });
    });

    describe('read-only enforcement', () => {
        it('should not have create method', () => {
            expect((service as unknown as { createLog?: unknown }).createLog).toBeUndefined();
        });

        it('should not have update method', () => {
            expect((service as unknown as { updateLog?: unknown }).updateLog).toBeUndefined();
        });

        it('should not have delete method', () => {
            expect((service as unknown as { deleteLog?: unknown }).deleteLog).toBeUndefined();
        });
    });
});

describe('Audit Mapper - Sensitive Field Masking', () => {
    it('should mask password fields', () => {
        const log = {
            id: 'log-1',
            module: 'auth',
            entity: 'User',
            entityId: 'user-1',
            action: 'login',
            userId: 'user-1',
            ipAddress: null,
            userAgent: null,
            changes: { password: 'secret123', passwordHash: 'hashed' },
            metadata: null,
            tenantId: 'tenant-1',
            branchId: null,
            createdAt: new Date(),
        };

        const result = mapAuditLogToResponse(log);

        expect(result.changes?.password).toBe(MASK_PATTERN);
        expect(result.changes?.passwordHash).toBe(MASK_PATTERN);
    });

    it('should mask token fields', () => {
        const log = {
            id: 'log-1',
            module: 'auth',
            entity: 'Session',
            entityId: 'session-1',
            action: 'create',
            userId: 'user-1',
            ipAddress: null,
            userAgent: null,
            changes: null,
            metadata: {
                accessToken: 'jwt123',
                refreshToken: 'refresh123',
                apiKey: 'key-456',
            },
            tenantId: 'tenant-1',
            branchId: null,
            createdAt: new Date(),
        };

        const result = mapAuditLogToResponse(log);

        expect(result.metadata?.accessToken).toBe(MASK_PATTERN);
        expect(result.metadata?.refreshToken).toBe(MASK_PATTERN);
        expect(result.metadata?.apiKey).toBe(MASK_PATTERN);
    });

    it('should not mask non-sensitive fields', () => {
        const log = {
            id: 'log-1',
            module: 'users',
            entity: 'User',
            entityId: 'user-1',
            action: 'update',
            userId: 'user-1',
            ipAddress: null,
            userAgent: null,
            changes: { email: 'new@email.com', name: 'John Doe' },
            metadata: { source: 'api' },
            tenantId: 'tenant-1',
            branchId: null,
            createdAt: new Date(),
        };

        const result = mapAuditLogToResponse(log);

        expect(result.changes?.email).toBe('new@email.com');
        expect(result.changes?.name).toBe('John Doe');
        expect(result.metadata?.source).toBe('api');
    });
});
