/**
 * Marks Routes
 */
import { Router } from 'express';
import { marksController } from './marks.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { MARKS_PERMISSIONS } from './marks.constants';
import {
    bulkEnterMarksSchema,
    updateMarksSchema,
    marksIdParamSchema,
    listMarksSchema,
    studentResultsSchema,
} from './marks.validator';

const router = Router();

router.use(fullAuthMiddleware);

router.post(
    '/',
    requirePermission(MARKS_PERMISSIONS.ENTER),
    validate(bulkEnterMarksSchema),
    marksController.bulkEnterMarks
);

router.get(
    '/',
    requirePermission(MARKS_PERMISSIONS.READ),
    validate(listMarksSchema),
    marksController.listMarks
);

router.get(
    '/:id',
    requirePermission(MARKS_PERMISSIONS.READ),
    validate(marksIdParamSchema),
    marksController.getMarks
);

router.patch(
    '/:id',
    requirePermission(MARKS_PERMISSIONS.UPDATE),
    validate(updateMarksSchema),
    marksController.updateMarks
);

// Student results
router.get(
    '/exam/:examId/student/:studentId',
    requirePermission(MARKS_PERMISSIONS.READ),
    validate(studentResultsSchema),
    marksController.getStudentResults
);

export { router as marksRoutes };
