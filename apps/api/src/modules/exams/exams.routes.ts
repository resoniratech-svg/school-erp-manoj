/**
 * Exams Routes
 */
import { Router } from 'express';
import { examsController } from './exams.controller';
import { validate } from '../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../authz';
import { EXAM_PERMISSIONS } from './exams.constants';
import {
    createExamSchema,
    updateExamSchema,
    examIdParamSchema,
    listExamsSchema,
    publishExamSchema,
} from './exams.validator';
import { schedulesRoutes } from './schedules';
import { marksRoutes } from './marks';

const router = Router();

router.use(fullAuthMiddleware);

// Mount sub-routes
router.use('/schedules', schedulesRoutes);
router.use('/marks', marksRoutes);

// Exam CRUD
router.post(
    '/',
    requirePermission(EXAM_PERMISSIONS.CREATE),
    validate(createExamSchema),
    examsController.createExam
);

router.get(
    '/',
    requirePermission(EXAM_PERMISSIONS.READ),
    validate(listExamsSchema),
    examsController.listExams
);

router.get(
    '/:id',
    requirePermission(EXAM_PERMISSIONS.READ),
    validate(examIdParamSchema),
    examsController.getExam
);

router.patch(
    '/:id',
    requirePermission(EXAM_PERMISSIONS.UPDATE),
    validate(updateExamSchema),
    examsController.updateExam
);

router.delete(
    '/:id',
    requirePermission(EXAM_PERMISSIONS.UPDATE),
    validate(examIdParamSchema),
    examsController.deleteExam
);

// Publish endpoint
router.post(
    '/:id/publish',
    requirePermission(EXAM_PERMISSIONS.PUBLISH),
    validate(publishExamSchema),
    examsController.publishExam
);

export { router as examsRoutes };
