/**
 * File Storage Repository
 * Database operations only - NO file system access
 */
import { prisma } from '@school-erp/database';
import type { FileEntityType, StorageProvider } from './files.types';

export class FilesRepository {
    /**
     * Find file by ID (tenant-scoped)
     */
    async findById(id: string, tenantId: string, branchId: string) {
        return prisma.fileAsset.findFirst({
            where: {
                id,
                tenantId,
                branchId,
                deletedAt: null,
            },
        });
    }

    /**
     * Find files by entity
     */
    async findByEntity(
        tenantId: string,
        branchId: string,
        entityType: FileEntityType,
        entityId: string
    ) {
        return prisma.fileAsset.findMany({
            where: {
                tenantId,
                branchId,
                entityType,
                entityId,
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Create file record
     */
    async create(data: {
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
    }) {
        return prisma.fileAsset.create({
            data,
        });
    }

    /**
     * Soft delete file (NOT allowed for immutable files)
     */
    async softDelete(id: string) {
        return prisma.fileAsset.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    /**
     * Check if entity exists (placeholder - implement per entity type)
     */
    async entityExists(
        tenantId: string,
        branchId: string,
        entityType: FileEntityType,
        entityId: string
    ): Promise<boolean> {
        // Generic entity existence check
        switch (entityType) {
            case 'student':
                return !!(await prisma.student.findFirst({
                    where: { id: entityId, tenantId, deletedAt: null },
                }));
            case 'staff':
                return !!(await prisma.staff.findFirst({
                    where: { id: entityId, tenantId, deletedAt: null },
                }));
            default:
                // For other entity types, assume exists (implement as needed)
                return true;
        }
    }
}

export const filesRepository = new FilesRepository();
