/**
 * Assignments Sub-module Routes
 */
import { Router } from 'express';
import { assignmentsController } from './assignments.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { TRANSPORT_ASSIGN_PERMISSIONS } from '../transport.constants';
import {
    createAssignmentSchema,
    updateAssignmentSchema,
    assignmentIdParamSchema,
    listAssignmentsSchema,
} from '../transport.validator';

const router = Router();

router.use(fullAuthMiddleware);

router.post(
    '/',
    requirePermission(TRANSPORT_ASSIGN_PERMISSIONS.CREATE),
    validate(createAssignmentSchema),
    assignmentsController.create
);

router.get(
    '/',
    requirePermission(TRANSPORT_ASSIGN_PERMISSIONS.READ),
    validate(listAssignmentsSchema),
    assignmentsController.list
);

router.get(
    '/:id',
    requirePermission(TRANSPORT_ASSIGN_PERMISSIONS.READ),
    validate(assignmentIdParamSchema),
    assignmentsController.get
);

router.patch(
    '/:id',
    requirePermission(TRANSPORT_ASSIGN_PERMISSIONS.UPDATE),
    validate(updateAssignmentSchema),
    assignmentsController.update
);

router.delete(
    '/:id',
    requirePermission(TRANSPORT_ASSIGN_PERMISSIONS.DELETE),
    validate(assignmentIdParamSchema),
    assignmentsController.cancel
);

export { router as assignmentsRoutes };
