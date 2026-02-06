/**
 * Jobs Routes
 * READ + RETRY only
 */
import { Router } from 'express';
import { jobsController } from './jobs.controller';
import { fullAuthMiddleware, requirePermission } from '../authz';
import { JOBS_PERMISSIONS } from './jobs.constants';

const router = Router();

router.use(fullAuthMiddleware);

// GET /jobs/status - Worker status (must be before :id)
router.get(
    '/status',
    requirePermission(JOBS_PERMISSIONS.READ),
    jobsController.getStatus
);

// GET /jobs - List jobs
router.get(
    '/',
    requirePermission(JOBS_PERMISSIONS.READ),
    jobsController.listJobs
);

// GET /jobs/:id - Get job by ID
router.get(
    '/:id',
    requirePermission(JOBS_PERMISSIONS.READ),
    jobsController.getJob
);

// POST /jobs/:id/retry - Retry failed job
router.post(
    '/:id/retry',
    requirePermission(JOBS_PERMISSIONS.RETRY),
    jobsController.retryJob
);

// NO POST /jobs (create) - jobs are created internally
// NO DELETE - append-only

export { router as jobsRoutes };
