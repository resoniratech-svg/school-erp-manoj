/**
 * Observability Controller
 * READ-ONLY endpoints
 */
import type { Request, Response, NextFunction } from 'express';
import { observabilityService, ObservabilityService } from './observability.service';

export class ObservabilityController {
    constructor(private readonly service: ObservabilityService = observabilityService) { }

    /**
     * GET /metrics - Prometheus metrics
     */
    getMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const metrics = this.service.getMetrics();

            res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
            res.status(200).send(metrics);
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /health - Liveness check
     */
    getHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const health = await this.service.getHealth();

            const statusCode = health.status === 'healthy' ? 200 :
                health.status === 'degraded' ? 200 : 503;

            res.status(statusCode).json(health);
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /ready - Readiness check
     */
    getReady = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const readiness = await this.service.getReadiness();

            res.status(readiness.ready ? 200 : 503).json(readiness);
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /status - System overview
     */
    getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = await this.service.getStatus();

            res.status(200).json({
                data: status,
                meta: { timestamp: new Date().toISOString() },
            });
        } catch (error) {
            next(error);
        }
    };

    // NO mutation endpoints
}

export const observabilityController = new ObservabilityController();
