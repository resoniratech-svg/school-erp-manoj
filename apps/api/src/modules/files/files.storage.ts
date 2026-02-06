/**
 * File Storage Abstraction
 * Local FS + S3-compatible storage
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { STORAGE_PROVIDER, FILE_DEFAULTS } from './files.constants';
import type { StorageProvider, StorageConfig } from './files.types';
import { getLogger } from '../../utils/logger';

const logger = getLogger('file-storage');

/**
 * Build storage path following tenant/branch/entity structure
 */
export function buildStoragePath(
    tenantId: string,
    branchId: string,
    entityType: string,
    entityId: string,
    fileId: string
): string {
    return `tenant/${tenantId}/branch/${branchId}/${entityType}/${entityId}/${fileId}`;
}

/**
 * Generate unique stored filename
 */
export function generateStoredName(originalName: string, fileId: string): string {
    const ext = path.extname(originalName);
    return `${fileId}${ext}`;
}

/**
 * Calculate file checksum (SHA-256)
 */
export function calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Storage Interface
 */
export interface IStorageProvider {
    save(storagePath: string, buffer: Buffer): Promise<void>;
    delete(storagePath: string): Promise<void>;
    getSignedUrl(storagePath: string, expirySeconds: number, originalName: string): Promise<string>;
    exists(storagePath: string): Promise<boolean>;
}

/**
 * Local File System Storage
 */
export class LocalStorage implements IStorageProvider {
    constructor(private basePath: string = FILE_DEFAULTS.LOCAL_STORAGE_PATH) { }

    async save(storagePath: string, buffer: Buffer): Promise<void> {
        const fullPath = path.join(this.basePath, storagePath);
        const dir = path.dirname(fullPath);

        // Create directory structure
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(fullPath, buffer);

        logger.info(`File saved to local storage: ${storagePath}`);
    }

    async delete(storagePath: string): Promise<void> {
        const fullPath = path.join(this.basePath, storagePath);

        try {
            await fs.unlink(fullPath);
            logger.info(`File deleted from local storage: ${storagePath}`);
        } catch (error) {
            logger.warn(`Failed to delete file: ${storagePath}`, { error });
        }
    }

    async getSignedUrl(storagePath: string, expirySeconds: number, originalName: string): Promise<string> {
        // For local storage, generate a token-based URL
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Math.floor(Date.now() / 1000) + expirySeconds;

        // In production, this would be a proper signed URL mechanism
        // For local dev, return a download endpoint path
        return `/api/v1/files/download/${token}?path=${encodeURIComponent(storagePath)}&expires=${expires}&name=${encodeURIComponent(originalName)}`;
    }

    async exists(storagePath: string): Promise<boolean> {
        const fullPath = path.join(this.basePath, storagePath);
        try {
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get file buffer (for local downloads)
     */
    async getBuffer(storagePath: string): Promise<Buffer> {
        const fullPath = path.join(this.basePath, storagePath);
        return fs.readFile(fullPath);
    }
}

/**
 * S3-Compatible Storage (placeholder for production)
 */
export class S3Storage implements IStorageProvider {
    constructor(
        private bucket: string = '',
        private region: string = ''
    ) { }

    async save(storagePath: string, buffer: Buffer): Promise<void> {
        // TODO: Implement S3 upload using @aws-sdk/client-s3
        // const s3Client = new S3Client({ region: this.region });
        // await s3Client.send(new PutObjectCommand({
        //   Bucket: this.bucket,
        //   Key: storagePath,
        //   Body: buffer,
        // }));
        logger.info(`S3 upload placeholder: ${storagePath}`);
        throw new Error('S3 storage not implemented - use local for development');
    }

    async delete(storagePath: string): Promise<void> {
        // TODO: Implement S3 delete
        logger.info(`S3 delete placeholder: ${storagePath}`);
    }

    async getSignedUrl(storagePath: string, expirySeconds: number, _originalName: string): Promise<string> {
        // TODO: Implement S3 presigned URL using @aws-sdk/s3-request-presigner
        // const command = new GetObjectCommand({ Bucket: this.bucket, Key: storagePath });
        // return getSignedUrl(s3Client, command, { expiresIn: expirySeconds });
        logger.info(`S3 signed URL placeholder: ${storagePath}, expires: ${expirySeconds}s`);
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${storagePath}`;
    }

    async exists(storagePath: string): Promise<boolean> {
        // TODO: Implement S3 head object check
        logger.info(`S3 exists check placeholder: ${storagePath}`);
        return false;
    }
}

/**
 * Get storage provider instance
 */
export function getStorageProvider(config: StorageConfig): IStorageProvider {
    if (config.provider === STORAGE_PROVIDER.S3) {
        return new S3Storage(config.s3Bucket, config.s3Region);
    }
    return new LocalStorage(config.localPath);
}

// Default local storage instance
export const localStorage = new LocalStorage();
