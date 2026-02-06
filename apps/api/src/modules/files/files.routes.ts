/**
 * File Storage Routes
 */
import { Router } from 'express';
import multer from 'multer';
import { filesController } from './files.controller';
import { validate } from '../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../authz';
import { FILES_PERMISSIONS, FILE_DEFAULTS } from './files.constants';
import {
    uploadFileSchema,
    listFilesByEntitySchema,
    fileIdParamSchema,
} from './files.validator';

const router = Router();

// Multer config for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: FILE_DEFAULTS.MAX_UPLOAD_MB * 1024 * 1024,
    },
});

router.use(fullAuthMiddleware);

// POST /files/upload - Upload file
router.post(
    '/upload',
    requirePermission(FILES_PERMISSIONS.UPLOAD),
    upload.single('file'),
    validate(uploadFileSchema),
    filesController.uploadFile
);

// GET /files/entity/:entityType/:entityId - List files by entity
router.get(
    '/entity/:entityType/:entityId',
    requirePermission(FILES_PERMISSIONS.READ),
    validate(listFilesByEntitySchema),
    filesController.listFilesByEntity
);

// GET /files/:id/download - Get signed download URL
router.get(
    '/:id/download',
    requirePermission(FILES_PERMISSIONS.READ),
    validate(fileIdParamSchema),
    filesController.downloadFile
);

// DELETE /files/:id - Soft delete (respects immutability)
router.delete(
    '/:id',
    requirePermission(FILES_PERMISSIONS.DELETE),
    validate(fileIdParamSchema),
    filesController.deleteFile
);

export { router as filesRoutes };
