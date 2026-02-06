/**
 * File Storage Service
 * Business logic with security enforcement
 */
import { v4 as uuid } from 'uuid';
import { NotFoundError, BadRequestError, ForbiddenError } from '@school-erp/shared';
import { FilesRepository, filesRepository } from './files.repository';
import {
    FILES_ERROR_CODES,
    IMMUTABLE_ENTITY_TYPES,
    DEFAULT_ALLOWED_MIME_TYPES,
    FILE_DEFAULTS,
    STORAGE_PROVIDER,
} from './files.constants';
import {
    localStorage,
    buildStoragePath,
    generateStoredName,
    calculateChecksum,
} from './files.storage';
import { mapFileToResponse, mapFileToDownloadResponse } from './files.mapper';
import { configService } from '../config';
import type {
    FileResponse,
    FileDownloadResponse,
    UploadFileInput,
    FilesContext,
    StorageConfig,
} from './files.types';
import { getLogger } from '../../utils/logger';

const logger = getLogger('files-service');

export class FilesService {
    constructor(private readonly repository: FilesRepository = filesRepository) { }

    /**
     * Upload a file
     */
    async uploadFile(input: UploadFileInput, context: FilesContext): Promise<FileResponse> {
        const config = await this.getStorageConfig(context);

        // Validate MIME type
        if (!config.allowedMimeTypes.includes(input.file.mimetype)) {
            throw new BadRequestError(FILES_ERROR_CODES.INVALID_MIME_TYPE);
        }

        // Validate file size
        const maxBytes = config.maxUploadMb * 1024 * 1024;
        if (input.file.size > maxBytes) {
            throw new BadRequestError(FILES_ERROR_CODES.FILE_TOO_LARGE);
        }

        // Validate entity exists
        const entityExists = await this.repository.entityExists(
            context.tenantId,
            context.branchId,
            input.entityType,
            input.entityId
        );
        if (!entityExists) {
            throw new NotFoundError(FILES_ERROR_CODES.ENTITY_NOT_FOUND);
        }

        // TODO: Virus scan hook placeholder
        // await virusScan(input.file.buffer);

        // Generate file ID and storage path
        const fileId = uuid();
        const storedName = generateStoredName(input.file.originalname, fileId);
        const storagePath = buildStoragePath(
            context.tenantId,
            context.branchId,
            input.entityType,
            input.entityId,
            storedName
        );
        const checksum = calculateChecksum(input.file.buffer);

        // Determine if file is immutable
        const isImmutable = IMMUTABLE_ENTITY_TYPES.includes(input.entityType as typeof IMMUTABLE_ENTITY_TYPES[number]);

        // Save file to storage
        await localStorage.save(storagePath, input.file.buffer);

        // Create database record
        const file = await this.repository.create({
            tenantId: context.tenantId,
            branchId: context.branchId,
            entityType: input.entityType,
            entityId: input.entityId,
            originalName: input.file.originalname,
            storedName,
            mimeType: input.file.mimetype,
            size: input.file.size,
            storageProvider: STORAGE_PROVIDER.LOCAL,
            storagePath,
            checksum,
            isImmutable,
            uploadedBy: context.userId,
        });

        logger.info(`File uploaded: ${fileId} by user ${context.userId}`);

        return mapFileToResponse(file);
    }

    /**
     * Get file by ID
     */
    async getFileById(id: string, context: FilesContext): Promise<FileResponse> {
        const file = await this.repository.findById(id, context.tenantId, context.branchId);

        if (!file) {
            throw new NotFoundError(FILES_ERROR_CODES.FILE_NOT_FOUND);
        }

        return mapFileToResponse(file);
    }

    /**
     * List files by entity
     */
    async listFilesByEntity(
        entityType: string,
        entityId: string,
        context: FilesContext
    ): Promise<FileResponse[]> {
        const files = await this.repository.findByEntity(
            context.tenantId,
            context.branchId,
            entityType as UploadFileInput['entityType'],
            entityId
        );

        return files.map(mapFileToResponse);
    }

    /**
     * Get download URL (signed)
     */
    async getDownloadUrl(id: string, context: FilesContext): Promise<FileDownloadResponse> {
        const file = await this.repository.findById(id, context.tenantId, context.branchId);

        if (!file) {
            throw new NotFoundError(FILES_ERROR_CODES.FILE_NOT_FOUND);
        }

        const config = await this.getStorageConfig(context);

        // Generate signed URL
        const signedUrl = await localStorage.getSignedUrl(
            file.storagePath,
            config.signedUrlExpirySeconds,
            file.originalName
        );

        // Audit log download
        logger.info(`File download requested: ${id} by user ${context.userId}`);

        return mapFileToDownloadResponse(file, signedUrl, config.signedUrlExpirySeconds);
    }

    /**
     * Delete file (soft delete, respects immutability)
     */
    async deleteFile(id: string, context: FilesContext): Promise<void> {
        const file = await this.repository.findById(id, context.tenantId, context.branchId);

        if (!file) {
            throw new NotFoundError(FILES_ERROR_CODES.FILE_NOT_FOUND);
        }

        // Check immutability
        if (file.isImmutable) {
            throw new ForbiddenError(FILES_ERROR_CODES.IMMUTABLE_FILE);
        }

        // Soft delete only
        await this.repository.softDelete(id);

        logger.info(`File soft deleted: ${id} by user ${context.userId}`);
    }

    /**
     * Get storage configuration from Module 16
     */
    private async getStorageConfig(context: FilesContext): Promise<StorageConfig> {
        try {
            const [maxUploadConfig, mimeTypesConfig, expiryConfig, providerConfig] = await Promise.all([
                configService.getConfigByKey('files.maxUploadMb', context).catch(() => null),
                configService.getConfigByKey('files.allowedMimeTypes', context).catch(() => null),
                configService.getConfigByKey('files.signedUrlExpirySeconds', context).catch(() => null),
                configService.getConfigByKey('files.storageProvider', context).catch(() => null),
            ]);

            return {
                provider: (providerConfig?.value as 'local' | 's3') ?? STORAGE_PROVIDER.LOCAL,
                localPath: FILE_DEFAULTS.LOCAL_STORAGE_PATH,
                maxUploadMb: (maxUploadConfig?.value as number) ?? FILE_DEFAULTS.MAX_UPLOAD_MB,
                allowedMimeTypes: DEFAULT_ALLOWED_MIME_TYPES as unknown as string[],
                signedUrlExpirySeconds: (expiryConfig?.value as number) ?? FILE_DEFAULTS.SIGNED_URL_EXPIRY_SECONDS,
            };
        } catch {
            // Fallback to defaults
            return {
                provider: STORAGE_PROVIDER.LOCAL,
                localPath: FILE_DEFAULTS.LOCAL_STORAGE_PATH,
                maxUploadMb: FILE_DEFAULTS.MAX_UPLOAD_MB,
                allowedMimeTypes: DEFAULT_ALLOWED_MIME_TYPES as unknown as string[],
                signedUrlExpirySeconds: FILE_DEFAULTS.SIGNED_URL_EXPIRY_SECONDS,
            };
        }
    }
}

export const filesService = new FilesService();
