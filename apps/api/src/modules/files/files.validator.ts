/**
 * File Storage Validators
 */
import { z } from 'zod';
import { FILE_ENTITY_TYPE } from './files.constants';

const entityTypes = Object.values(FILE_ENTITY_TYPE) as [string, ...string[]];

// Upload file validation (body + file)
export const uploadFileSchema = z.object({
    body: z.object({
        entityType: z.enum(entityTypes),
        entityId: z.string().uuid(),
    }),
});

// List files by entity
export const listFilesByEntitySchema = z.object({
    params: z.object({
        entityType: z.enum(entityTypes),
        entityId: z.string().uuid(),
    }),
});

// Get file by ID
export const fileIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

// Type exports
export type UploadFileBody = z.infer<typeof uploadFileSchema>['body'];
export type ListFilesParams = z.infer<typeof listFilesByEntitySchema>['params'];
