/**
 * Exam Schedules Routes
 */
import { Router } from 'express';
import { schedulesController } from './schedules.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { EXAM_PERMISSIONS } from '../exams.constants';
import {
    createScheduleSchema,
    updateScheduleSchema,
    scheduleIdParamSchema,
    listSchedulesSchema,
} from './schedules.validator';

const router = Router();

router.use(fullAuthMiddleware);

router.post(
    '/',
    requirePermission(EXAM_PERMISSIONS.CREATE),
    validate(createScheduleSchema),
    schedulesController.createSchedule
);

router.get(
    '/',
    requirePermission(EXAM_PERMISSIONS.READ),
    validate(listSchedulesSchema),
    schedulesController.listSchedules
);

router.get(
    '/:id',
    requirePermission(EXAM_PERMISSIONS.READ),
    validate(scheduleIdParamSchema),
    schedulesController.getSchedule
);

router.patch(
    '/:id',
    requirePermission(EXAM_PERMISSIONS.UPDATE),
    validate(updateScheduleSchema),
    schedulesController.updateSchedule
);

router.delete(
    '/:id',
    requirePermission(EXAM_PERMISSIONS.UPDATE),
    validate(scheduleIdParamSchema),
    schedulesController.deleteSchedule
);

export { router as schedulesRoutes };
