/**
 * System Config Routes
 * GET and PATCH only - NO POST (create), NO DELETE
 */
import { Router } from 'express';
import { configController } from './config.controller';
import { validate } from '../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../authz';
import { CONFIG_PERMISSIONS } from './config.constants';
import {
    getConfigsSchema,
    getConfigByKeySchema,
    updateConfigSchema,
    batchUpdateConfigSchema,
} from './config.validator';

const router = Router();

router.use(fullAuthMiddleware);

// GET /config - Get all resolved configs
router.get(
    '/',
    requirePermission(CONFIG_PERMISSIONS.READ),
    validate(getConfigsSchema),
    configController.getAllConfigs
);

// GET /config/:key - Get single config by key
router.get(
    '/:key',
    requirePermission(CONFIG_PERMISSIONS.READ),
    validate(getConfigByKeySchema),
    configController.getConfigByKey
);

// PATCH /config - Update single config (upsert)
router.patch(
    '/',
    requirePermission(CONFIG_PERMISSIONS.UPDATE),
    validate(updateConfigSchema),
    configController.updateConfig
);

// PATCH /config/batch - Batch update configs (upsert)
router.patch(
    '/batch',
    requirePermission(CONFIG_PERMISSIONS.UPDATE),
    validate(batchUpdateConfigSchema),
    configController.batchUpdateConfigs
);

// NO POST (use PATCH for upsert)
// NO DELETE (configs are never deleted)

export { router as configRoutes };
