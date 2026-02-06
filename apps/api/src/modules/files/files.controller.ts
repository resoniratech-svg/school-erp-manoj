/**
 * File Storage Controller
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@school-erp/shared';
import { filesService, FilesService } from './files.service';
import { getRequestContext } from '../authz';
import type { UploadFileBody, ListFilesParams } from './files.validator';

export class FilesController {
    constructor(private readonly service: FilesService = filesService) { }

    /**
     * POST /files/upload - Upload a file
     */
    uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const body = req.body as UploadFileBody;
            const file = req.file;

            if (!file) {
                res.status(400).json({ error: 'No file provided' });
                return;
            }

            const result = await this.service.uploadFile(
                {
                    entityType: body.entityType,
                    entityId: body.entityId,
                    file: {
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                        buffer: file.buffer,
                    },
                },
                {
                    tenantId: context.tenant.id,
                    branchId: context.branch?.id || '',
                    userId: context.user.id,
                }
            );

            res.status(201).json(
                createApiResponse(result, {
                    message: 'File uploaded successfully',
                    meta: { requestId: (req as Request & { requestId?: string }).requestId },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /files/entity/:entityType/:entityId - List files by entity
     */
    listFilesByEntity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const params = req.params as unknown as ListFilesParams;

            const files = await this.service.listFilesByEntity(
                params.entityType,
                params.entityId,
                {
                    tenantId: context.tenant.id,
                    branchId: context.branch?.id || '',
                    userId: context.user.id,
                }
            );

            res.status(200).json(
                createApiResponse({ files }, {
                    meta: { requestId: (req as Request & { requestId?: string }).requestId },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /files/:id/download - Get signed download URL
     */
    downloadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const result = await this.service.getDownloadUrl(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(result, {
                    meta: { requestId: (req as Request & { requestId?: string }).requestId },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * DELETE /files/:id - Soft delete file
     */
    deleteFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            await this.service.deleteFile(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id || '',
                userId: context.user.id,
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };
}

export const filesController = new FilesController();
