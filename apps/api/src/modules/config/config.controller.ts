/**
 * System Config Controller
 * GET and PATCH only - NO DELETE
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@school-erp/shared';
import { configService, ConfigService } from './config.service';
import { getRequestContext } from '../authz';
import type { UpdateConfigBody, BatchUpdateConfigBody, GetConfigsQuery } from './config.validator';

export class ConfigController {
    constructor(private readonly service: ConfigService = configService) { }

    /**
     * GET /config - Get all resolved configs
     */
    getAllConfigs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const query = req.query as unknown as GetConfigsQuery;

            const result = await this.service.getAllConfigs(
                {
                    tenantId: context.tenant.id,
                    branchId: context.branch?.id,
                    userId: context.user.id,
                },
                { prefix: query.prefix }
            );

            res.status(200).json(
                createApiResponse(result, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /config/:key - Get single config by key
     */
    getConfigByKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { key } = req.params;

            const result = await this.service.getConfigByKey(key, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(result, {
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * PATCH /config - Update single config
     */
    updateConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as UpdateConfigBody;

            const result = await this.service.updateConfig(input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(result, {
                    message: 'Config updated successfully',
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * PATCH /config/batch - Batch update configs
     */
    batchUpdateConfigs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const input = req.body as BatchUpdateConfigBody;

            const results = await this.service.batchUpdateConfigs(input, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse({ configs: results }, {
                    message: `${results.length} configs updated successfully`,
                    meta: { requestId: req.requestId as string },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    // NO DELETE ENDPOINT
}

export const configController = new ConfigController();
