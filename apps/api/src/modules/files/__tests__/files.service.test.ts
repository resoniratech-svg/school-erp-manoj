/**
 * Files Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { FilesService } from '../files.service';
import type { FilesRepository } from '../files.repository';
import { FILES_ERROR_CODES, FILE_ENTITY_TYPE } from '../files.constants';

// Mock storage
vi.mock('../files.storage', () => ({
    localStorage: {
        save: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        getSignedUrl: vi.fn().mockResolvedValue('https://signed-url'),
    },
    buildStoragePath: vi.fn().mockReturnValue('tenant/t1/branch/b1/student/s1/file.pdf'),
    generateStoredName: vi.fn().mockReturnValue('file-id.pdf'),
    calculateChecksum: vi.fn().mockReturnValue('abc123'),
}));

// Mock config
vi.mock('../../config', () => ({
    configService: {
        getConfigByKey: vi.fn().mockResolvedValue({ value: 10 }),
    },
}));

describe('FilesService', () => {
    let service: FilesService;
    let mockRepository: {
        findById: Mock;
        findByEntity: Mock;
        create: Mock;
        softDelete: Mock;
        entityExists: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockFile = {
        id: 'file-1',
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        entityType: 'student',
        entityId: 'student-1',
        originalName: 'document.pdf',
        storedName: 'file-1.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        storageProvider: 'local',
        storagePath: 'tenant/t1/branch/b1/student/s1/file-1.pdf',
        checksum: 'abc123',
        isImmutable: false,
        uploadedBy: 'user-789',
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

    describe('uploadFile', () => {
        it('should upload file successfully', async () => {
            mockRepository.entityExists.mockResolvedValue(true);
            mockRepository.create.mockResolvedValue(mockFile);

            const result = await service.uploadFile(
                {
                    entityType: FILE_ENTITY_TYPE.STUDENT,
                    entityId: 'student-1',
                    file: {
                        originalname: 'document.pdf',
                        mimetype: 'application/pdf',
                        size: 1024,
                        buffer: Buffer.from('test'),
                    },
                },
                mockContext
            );

            expect(result.originalName).toBe('document.pdf');
            expect(mockRepository.create).toHaveBeenCalled();
        });

        it('should reject invalid MIME type', async () => {
            await expect(
                service.uploadFile(
                    {
                        entityType: FILE_ENTITY_TYPE.STUDENT,
                        entityId: 'student-1',
                        file: {
                            originalname: 'malware.exe',
                            mimetype: 'application/x-executable',
                            size: 1024,
                            buffer: Buffer.from('test'),
                        },
                    },
                    mockContext
                )
            ).rejects.toThrow(FILES_ERROR_CODES.INVALID_MIME_TYPE);
        });

        it('should reject oversize file', async () => {
            await expect(
                service.uploadFile(
                    {
                        entityType: FILE_ENTITY_TYPE.STUDENT,
                        entityId: 'student-1',
                        file: {
                            originalname: 'large.pdf',
                            mimetype: 'application/pdf',
                            size: 100 * 1024 * 1024, // 100MB
                            buffer: Buffer.from('test'),
                        },
                    },
                    mockContext
                )
            ).rejects.toThrow(FILES_ERROR_CODES.FILE_TOO_LARGE);
        });
    });

    describe('deleteFile', () => {
        it('should reject delete of immutable file', async () => {
            mockRepository.findById.mockResolvedValue({
                ...mockFile,
                isImmutable: true,
                entityType: 'fee',
            });

            await expect(
                service.deleteFile('file-1', mockContext)
            ).rejects.toThrow(FILES_ERROR_CODES.IMMUTABLE_FILE);
        });

        it('should soft delete mutable file', async () => {
            mockRepository.findById.mockResolvedValue(mockFile);
            mockRepository.softDelete.mockResolvedValue({ ...mockFile, deletedAt: new Date() });

            await expect(
                service.deleteFile('file-1', mockContext)
            ).resolves.not.toThrow();

            expect(mockRepository.softDelete).toHaveBeenCalledWith('file-1');
        });
    });

    describe('getDownloadUrl', () => {
        it('should return signed URL', async () => {
            mockRepository.findById.mockResolvedValue(mockFile);

            const result = await service.getDownloadUrl('file-1', mockContext);

            expect(result.signedUrl).toBe('https://signed-url');
            expect(result.expiresAt).toBeInstanceOf(Date);
        });
    });
});
