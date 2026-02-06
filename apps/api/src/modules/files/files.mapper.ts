/**
 * File Storage Mapper
 * Transform DB records to safe API responses
 */
import type { FileAsset, FileResponse, FileDownloadResponse } from './files.types';

type FileRecord = {
    id: string;
    tenantId: string;
    branchId: string;
    entityType: string;
    entityId: string;
    originalName: string;
    storedName: string;
    mimeType: string;
    size: number;
    storageProvider: string;
    storagePath: string;
    checksum: string | null;
    isImmutable: boolean;
    uploadedBy: string;
    createdAt: Date;
    deletedAt: Date | null;
};

/**
 * Map file record to safe response (NO storage path)
 */
export function mapFileToResponse(file: FileRecord): FileResponse {
    return {
        id: file.id,
        entityType: file.entityType as FileResponse['entityType'],
        entityId: file.entityId,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        isImmutable: file.isImmutable,
        uploadedBy: file.uploadedBy,
        createdAt: file.createdAt,
        // NO storagePath, storedName, storageProvider exposed
    };
}

/**
 * Map file to download response with signed URL
 */
export function mapFileToDownloadResponse(
    file: FileRecord,
    signedUrl: string,
    expirySeconds: number
): FileDownloadResponse {
    return {
        id: file.id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        signedUrl,
        expiresAt: new Date(Date.now() + expirySeconds * 1000),
    };
}
