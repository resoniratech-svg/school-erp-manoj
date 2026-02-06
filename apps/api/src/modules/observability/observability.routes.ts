/**
 * Observability Routes
 * Public endpoints (no auth for health/metrics)
 */
import { Router } from 'express';
import { observabilityController } from './observability.controller';

const router = Router();

// GET /metrics - Prometheus metrics (no auth for scraping)
router.get('/metrics', observabilityController.getMetrics);

// GET /health - Liveness (no auth for k8s probes)
router.get('/health', observabilityController.getHealth);

// GET /ready - Readiness (no auth for k8s probes)
router.get('/ready', observabilityController.getReady);

// GET /status - System overview (can be protected)
router.get('/status', observabilityController.getStatus);

// NO mutation endpoints

export { router as observabilityRoutes };
