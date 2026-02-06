/**
 * Subjects Routes
 * Express router with RBAC middleware
 */
import { Router } from 'express';
import { subjectsController } from './subjects.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { SUBJECT_PERMISSIONS } from './subjects.constants';
import {
    createSubjectSchema,
    updateSubjectSchema,
    subjectIdParamSchema,
    listSubjectsSchema,
} from './subjects.validator';

const router = Router();

// Apply auth middleware to all routes
router.use(fullAuthMiddleware);

// Create subject
router.post(
    '/',
    requirePermission(SUBJECT_PERMISSIONS.CREATE),
    validate(createSubjectSchema),
    subjectsController.createSubject
);

// List subjects
router.get(
    '/',
    requirePermission(SUBJECT_PERMISSIONS.READ),
    validate(listSubjectsSchema),
    subjectsController.listSubjects
);

// Get subject by ID
router.get(
    '/:id',
    requirePermission(SUBJECT_PERMISSIONS.READ),
    validate(subjectIdParamSchema),
    subjectsController.getSubject
);

// Update subject
router.patch(
    '/:id',
    requirePermission(SUBJECT_PERMISSIONS.UPDATE),
    validate(updateSubjectSchema),
    subjectsController.updateSubject
);

// Delete subject
router.delete(
    '/:id',
    requirePermission(SUBJECT_PERMISSIONS.DELETE),
    validate(subjectIdParamSchema),
    subjectsController.deleteSubject
);

export { router as subjectsRoutes };
