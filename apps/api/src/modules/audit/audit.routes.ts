/**
 * Audit Module Routes
 * READ-ONLY - NO POST, PUT, PATCH, DELETE endpoints
 */
import { Router } from 'express';
import { auditController } from './audit.controller';
import { validate } from '../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../authz';
import { AUDIT_PERMISSIONS } from './audit.constants';
import { listAuditLogsSchema, auditLogIdParamSchema } from './audit.validator';

const router = Router();

router.use(fullAuthMiddleware);

// GET /audit/logs - List audit logs with filters
router.get(
    '/logs',
    requirePermission(AUDIT_PERMISSIONS.READ_BRANCH),
    validate(listAuditLogsSchema),
    auditController.listLogs
);

// GET /audit/logs/:id - Get single log by ID
router.get(
    '/logs/:id',
    requirePermission(AUDIT_PERMISSIONS.READ_BRANCH),
    validate(auditLogIdParamSchema),
    auditController.getLog
);

// GET /audit/filters - Get available filter options
router.get(
    '/filters',
    requirePermission(AUDIT_PERMISSIONS.READ_BRANCH),
    auditController.getFilterOptions
);

// NO POST, PUT, PATCH, DELETE routes

export { router as auditRoutes };
