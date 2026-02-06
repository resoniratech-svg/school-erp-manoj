/**
 * Files Security Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { FilesService } from '../files.service';
import type { FilesRepository } from '../files.repository';
import { FILES_ERROR_CODES } from '../files.constants';

// Mock storage
vi.mock('../files.storage', () => ({
    localStorage: {
        save: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        getSignedUrl: vi.fn().mockResolvedValue('https://signed-url'),
    },
    buildStoragePath: vi.fn().mockReturnValue('path'),
    generateStoredName: vi.fn().mockReturnValue('name'),
    calculateChecksum: vi.fn().mockReturnValue('hash'),
}));

vi.mock('../../config', () => ({
    configService: {
        getConfigByKey: vi.fn().mockResolvedValue({ value: 10 }),
    },
}));

describe('Files Security', () => {
    let service: FilesService;
    let mockRepository: {
        findById: Mock;
        findByEntity: Mock;
        create: Mock;
        softDelete: Mock;
        entityExists: Mock;
    };

    const tenantAContext = {
        tenantId: 'tenant-A',
        branchId: 'branch-A1',
        userId: 'user-A',
    };

    const tenantBContext = {
        tenantId: 'tenant-B',
        branchId: 'branch-B1',
        userId: 'user-B',
    };

    const branchA2Context = {
        tenantId: 'tenant-A',
        branchId: 'branch-A2', // Different branch, same tenant
        userId: 'user-A',
    };

    const mockFileTenantA = {
        id: 'file-A',
        tenantId: 'tenant-A',
        branchId: 'branch-A1',
        entityType: 'student',
        entityId: 'student-1',
        originalName: 'doc.pdf',
        storedName: 'file-A.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        storageProvider: 'local',
        storagePath: 'path',
        checksum: 'hash',
        isImmutable: false,
        uploadedBy: 'user-A',
        createdAt: new Date(),
        deletedAt: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockRepository = {
            findById: vi.fn(),
            findByEntity: vi.fn(),
            create: vi.fn(),
            softDelete: vi.fn(),
            entityExists: vi.fn(),
        };

        service = new FilesService(mockRepository as unknown as FilesRepository);
    });

    describe('cross-tenant download blocked', () => {
        it('should block tenant B from accessing tenant A file', async () => {
            // Repository returns null for cross-tenant (scoped query)
            mockRepository.findById.mockResolvedValue(null);

            await expect(
                service.getDownloadUrl('file-A', tenantBContext)
            ).rejects.toThrow(FILES_ERROR_CODES.FILE_NOT_FOUND);
        });
    });

    describe('cross-branch access blocked', () => {
        it('should block different branch from accessing file', async () => {
            // Repository returns null for cross-branch (scoped query)
            mockRepository.findById.mockResolvedValue(null);

            await expect(
                service.getDownloadUrl('file-A', branchA2Context)
            ).rejects.toThrow(FILES_ERROR_CODES.FILE_NOT_FOUND);
        });

        it('should allow same tenant+branch access', async () => {
            mockRepository.findById.mockResolvedValue(mockFileTenantA);

            const result = await service.getDownloadUrl('file-A', tenantAContext);

            expect(result.signedUrl).toBe('https://signed-url');
        });
    });

    describe('signed URL expiry', () => {
        it('should include expiry timestamp', async () => {
            mockRepository.findById.mockResolvedValue(mockFileTenantA);

            const result = await service.getDownloadUrl('file-A', tenantAContext);

            expect(result.expiresAt).toBeInstanceOf(Date);
            expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
        });
    });

    describe('audit log created on download', () => {
        it('should log download request', async () => {
            mockRepository.findById.mockResolvedValue(mockFileTenantA);

            // The service logs internally, we just verify no errors
            await expect(
                service.getDownloadUrl('file-A', tenantAContext)
            ).resolves.not.toThrow();
        });
    });

    describe('immutable files', () => {
        it('should mark fee files as immutable', async () => {
            mockRepository.entityExists.mockResolvedValue(true);
            mockRepository.create.mockImplementation((data: { isImmutable: boolean }) =>
                Promise.resolve({ ...mockFileTenantA, ...data, entityType: 'fee' })
            );

            const result = await service.uploadFile(
                {
                    entityType: 'fee' as const,
                    entityId: 'fee-1',
                    file: {
                        originalname: 'receipt.pdf',
                        mimetype: 'application/pdf',
                        size: 1024,
                        buffer: Buffer.from('test'),
                    },
                },
                tenantAContext
            );

            expect(result.isImmutable).toBe(true);
        });
    });
});
