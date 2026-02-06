/**
 * Classes Routes
 * Express router with RBAC middleware
 */
import { Router } from 'express';
import { classesController } from './classes.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { CLASS_PERMISSIONS } from './classes.constants';
import {
    createClassSchema,
    updateClassSchema,
    classIdParamSchema,
    listClassesSchema,
} from './classes.validator';
import { classSubjectsRoutes } from '../class-subjects';

const router = Router();

// Apply auth middleware to all routes
router.use(fullAuthMiddleware);

// Create class
router.post(
    '/',
    requirePermission(CLASS_PERMISSIONS.CREATE),
    validate(createClassSchema),
    classesController.createClass
);

// List classes
router.get(
    '/',
    requirePermission(CLASS_PERMISSIONS.READ),
    validate(listClassesSchema),
    classesController.listClasses
);

// Get class by ID
router.get(
    '/:id',
    requirePermission(CLASS_PERMISSIONS.READ),
    validate(classIdParamSchema),
    classesController.getClass
);

// Update class
router.patch(
    '/:id',
    requirePermission(CLASS_PERMISSIONS.UPDATE),
    validate(updateClassSchema),
    classesController.updateClass
);

// Delete class
router.delete(
    '/:id',
    requirePermission(CLASS_PERMISSIONS.DELETE),
    validate(classIdParamSchema),
    classesController.deleteClass
);

// Mount class-subjects nested routes
router.use('/:classId/subjects', classSubjectsRoutes);

export { router as classesRoutes };

