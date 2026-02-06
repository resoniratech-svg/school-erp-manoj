/**
 * Transport Module Routes
 */
import { Router } from 'express';
import { fullAuthMiddleware } from '../authz';
import { transportRoutesRoutes } from './routes';
import { vehiclesRoutes } from './vehicles';
import { assignmentsRoutes } from './assignments';

const router = Router();

router.use(fullAuthMiddleware);

// Mount sub-routes
router.use('/routes', transportRoutesRoutes);
router.use('/vehicles', vehiclesRoutes);
router.use('/assignments', assignmentsRoutes);

export { router as transportRoutes };
