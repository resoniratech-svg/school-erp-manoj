/**
 * File Storage Types
 */

// Storage Provider Type
export type StorageProvider = 'local' | 's3';

// Entity Type
export type FileEntityType =
    | 'student'
    | 'staff'
    | 'fee'
    | 'exam'
    | 'report'
    | 'transport'
    | 'library'
    | 'announcement';

// File Asset (database representation)
export interface FileAsset {
    id: string;
    tenantId: string;
    branchId: string;
    entityType: FileEntityType;
    entityId: string;
    originalName: string;
    storedName: string;
    mimeType: string;
    size: number;
    storageProvider: StorageProvider;
    storagePath: string;
    checksum: string | null;
    isImmutable: boolean;
    uploadedBy: string;
    createdAt: Date;
    deletedAt: Date | null;
}

// File Response (API response)
export interface FileResponse {
    id: string;
    entityType: FileEntityType;
    entityId: string;
    originalName: string;
    mimeType: string;
    size: number;
    isImmutable: boolean;
    uploadedBy: string;
    createdAt: Date;
    // NO storage path exposed
}

// File Download Response (with signed URL)
export interface FileDownloadResponse {
    id: string;
    originalName: string;
    mimeType: string;
    signedUrl: string;
    expiresAt: Date;
}

// Upload Input
export interface UploadFileInput {
    entityType: FileEntityType;
    entityId: string;
    file: {
        originalname: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
    };
}

// Context
export interface FilesContext {
    tenantId: string;
    branchId: string;
    userId: string;
}

// Storage Config
export interface StorageConfig {
    provider: StorageProvider;
    localPath?: string;
    s3Bucket?: string;
    s3Region?: string;
    maxUploadMb: number;
    allowedMimeTypes: string[];
    signedUrlExpirySeconds: number;
}
