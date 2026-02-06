/**
 * Notification Delivery Controller
 * READ + RETRY only - NO CREATE, NO DELETE
 */
import type { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@school-erp/shared';
import { deliveryService, DeliveryService } from './notification-delivery.service';
import { getRequestContext } from '../authz';
import type { ListDeliveriesQuery } from './notification-delivery.validator';

export class DeliveryController {
    constructor(private readonly service: DeliveryService = deliveryService) { }

    /**
     * GET /notification-delivery - List deliveries
     */
    listDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const query = req.query as unknown as ListDeliveriesQuery;

            const result = await this.service.listDeliveries(query, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id,
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
     * GET /notification-delivery/:id - Get delivery by ID
     */
    getDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const result = await this.service.getDeliveryById(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id,
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
     * POST /notification-delivery/:id/retry - Retry failed delivery
     */
    retryDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = getRequestContext(req);
            const { id } = req.params;

            const result = await this.service.retryDelivery(id, {
                tenantId: context.tenant.id,
                branchId: context.branch?.id,
                userId: context.user.id,
            });

            res.status(200).json(
                createApiResponse(result, {
                    message: 'Delivery retry initiated',
                    meta: { requestId: (req as Request & { requestId?: string }).requestId },
                })
            );
        } catch (error) {
            next(error);
        }
    };

    // NO CREATE endpoint - deliveries are created internally
    // NO DELETE endpoint - deliveries are append-only
}

export const deliveryController = new DeliveryController();
