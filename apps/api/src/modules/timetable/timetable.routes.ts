/**
 * Timetable Routes
 * Express router with RBAC middleware
 */
import { Router } from 'express';
import { timetableController } from './timetable.controller';
import { periodsRoutes } from './periods';
import { validate } from '../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../authz';
import { TIMETABLE_PERMISSIONS } from './timetable.constants';
import {
    createTimetableSchema,
    createTimetableEntrySchema,
    updateTimetableSchema,
    timetableIdParamSchema,
    listTimetablesSchema,
    classTimetableSchema,
    teacherTimetableSchema,
    validateTimetableSchema,
    entryIdParamSchema,
} from './timetable.validator';

const router = Router();

// Apply auth middleware to all routes
router.use(fullAuthMiddleware);

// Mount periods sub-module
router.use('/periods', periodsRoutes);

// Create timetable
router.post(
    '/',
    requirePermission(TIMETABLE_PERMISSIONS.CREATE),
    validate(createTimetableSchema),
    timetableController.createTimetable
);

// List timetables
router.get(
    '/',
    requirePermission(TIMETABLE_PERMISSIONS.READ),
    validate(listTimetablesSchema),
    timetableController.listTimetables
);

// Validate timetable (bulk check)
router.post(
    '/validate',
    requirePermission(TIMETABLE_PERMISSIONS.READ),
    validate(validateTimetableSchema),
    timetableController.validateTimetable
);

// Get class timetable
router.get(
    '/classes/:classId',
    requirePermission(TIMETABLE_PERMISSIONS.READ),
    validate(classTimetableSchema),
    timetableController.getClassTimetable
);

// Get teacher timetable
router.get(
    '/teachers/:teacherId',
    requirePermission(TIMETABLE_PERMISSIONS.READ),
    validate(teacherTimetableSchema),
    timetableController.getTeacherTimetable
);

// Get timetable by ID
router.get(
    '/:id',
    requirePermission(TIMETABLE_PERMISSIONS.READ),
    validate(timetableIdParamSchema),
    timetableController.getTimetable
);

// Update timetable
router.patch(
    '/:id',
    requirePermission(TIMETABLE_PERMISSIONS.UPDATE),
    validate(updateTimetableSchema),
    timetableController.updateTimetable
);

// Delete timetable
router.delete(
    '/:id',
    requirePermission(TIMETABLE_PERMISSIONS.DELETE),
    validate(timetableIdParamSchema),
    timetableController.deleteTimetable
);

// Add entry to timetable
router.post(
    '/:id/entries',
    requirePermission(TIMETABLE_PERMISSIONS.UPDATE),
    validate(createTimetableEntrySchema),
    timetableController.addEntry
);

// Remove entry from timetable
router.delete(
    '/:id/entries/:entryId',
    requirePermission(TIMETABLE_PERMISSIONS.UPDATE),
    validate(entryIdParamSchema),
    timetableController.removeEntry
);

export { router as timetableRoutes };
