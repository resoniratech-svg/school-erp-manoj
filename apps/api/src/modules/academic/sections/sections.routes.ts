/**
 * Sections Routes
 * Express router with RBAC middleware
 */
import { Router } from 'express';
import { sectionsController } from './sections.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { SECTION_PERMISSIONS } from './sections.constants';
import {
    createSectionSchema,
    updateSectionSchema,
    assignClassTeacherSchema,
    sectionIdParamSchema,
    listSectionsSchema,
} from './sections.validator';

const router = Router();

// Apply auth middleware to all routes
router.use(fullAuthMiddleware);

// Create section
router.post(
    '/',
    requirePermission(SECTION_PERMISSIONS.CREATE),
    validate(createSectionSchema),
    sectionsController.createSection
);

// List sections
router.get(
    '/',
    requirePermission(SECTION_PERMISSIONS.READ),
    validate(listSectionsSchema),
    sectionsController.listSections
);

// Get section by ID
router.get(
    '/:id',
    requirePermission(SECTION_PERMISSIONS.READ),
    validate(sectionIdParamSchema),
    sectionsController.getSection
);

// Update section
router.patch(
    '/:id',
    requirePermission(SECTION_PERMISSIONS.UPDATE),
    validate(updateSectionSchema),
    sectionsController.updateSection
);

// Assign class teacher
router.patch(
    '/:id/class-teacher',
    requirePermission(SECTION_PERMISSIONS.UPDATE),
    validate(assignClassTeacherSchema),
    sectionsController.assignClassTeacher
);

// Delete section
router.delete(
    '/:id',
    requirePermission(SECTION_PERMISSIONS.DELETE),
    validate(sectionIdParamSchema),
    sectionsController.deleteSection
);

export { router as sectionsRoutes };
