/**
 * File Storage Constants
 * Security-first file management
 */
import { createPermission } from '@school-erp/shared';

// Permissions
export const FILES_PERMISSIONS = {
    UPLOAD: createPermission('file', 'upload', 'branch'),
    READ: createPermission('file', 'read', 'branch'),
    DELETE: createPermission('file', 'delete', 'branch'),
} as const;

// Storage Providers
export const STORAGE_PROVIDER = {
    LOCAL: 'local',
    S3: 's3',
} as const;

// Entity Types (what files can be attached to)
export const FILE_ENTITY_TYPE = {
    STUDENT: 'student',
    STAFF: 'staff',
    FEE: 'fee',
    EXAM: 'exam',
    REPORT: 'report',
    TRANSPORT: 'transport',
    LIBRARY: 'library',
    ANNOUNCEMENT: 'announcement',
} as const;

// Allowed MIME Types (default whitelist)
export const DEFAULT_ALLOWED_MIME_TYPES = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Text
    'text/plain',
    'text/csv',
] as const;

// Immutable Entity Types (NEVER delete)
export const IMMUTABLE_ENTITY_TYPES = [
    FILE_ENTITY_TYPE.FEE,
    FILE_ENTITY_TYPE.REPORT,
] as const;

// Default Limits
export const FILE_DEFAULTS = {
    MAX_UPLOAD_MB: 10,
    SIGNED_URL_EXPIRY_SECONDS: 3600, // 1 hour
    LOCAL_STORAGE_PATH: './uploads',
} as const;

// Error Codes
export const FILES_ERROR_CODES = {
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    INVALID_MIME_TYPE: 'INVALID_MIME_TYPE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND',
    CROSS_TENANT_FORBIDDEN: 'CROSS_TENANT_FORBIDDEN',
    IMMUTABLE_FILE: 'IMMUTABLE_FILE_CANNOT_DELETE',
    UPLOAD_FAILED: 'UPLOAD_FAILED',
    STORAGE_ERROR: 'STORAGE_ERROR',
} as const;
