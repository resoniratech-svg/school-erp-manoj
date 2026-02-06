/**
 * Class-Subjects Routes
 * Express router with RBAC middleware
 * Mounted under /api/v1/academic/classes/:classId/subjects
 */
import { Router } from 'express';
import { classSubjectsController } from './class-subjects.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { CLASS_SUBJECT_PERMISSIONS } from './class-subjects.constants';
import {
    assignSubjectSchema,
    listClassSubjectsSchema,
    removeSubjectSchema,
} from './class-subjects.validator';

// Use mergeParams to access :classId from parent router
const router = Router({ mergeParams: true });

// Apply auth middleware to all routes
router.use(fullAuthMiddleware);

// Assign subject to class
router.post(
    '/',
    requirePermission(CLASS_SUBJECT_PERMISSIONS.ASSIGN),
    validate(assignSubjectSchema),
    classSubjectsController.assignSubject
);

// List subjects for a class
router.get(
    '/',
    requirePermission(CLASS_SUBJECT_PERMISSIONS.READ),
    validate(listClassSubjectsSchema),
    classSubjectsController.listClassSubjects
);

// Remove subject from class
router.delete(
    '/:subjectId',
    requirePermission(CLASS_SUBJECT_PERMISSIONS.ASSIGN),
    validate(removeSubjectSchema),
    classSubjectsController.removeSubject
);

export { router as classSubjectsRoutes };
