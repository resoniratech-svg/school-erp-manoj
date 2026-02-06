/**
 * Fee Assignments Routes
 */
import { Router } from 'express';
import { assignmentsController } from './assignments.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { FEE_ASSIGNMENT_PERMISSIONS } from '../fees.constants';
import {
    assignFeeSchema,
    bulkAssignFeeSchema,
    feeAssignmentIdParamSchema,
    listFeeAssignmentsSchema,
} from '../fees.validator';

const router = Router();

router.use(fullAuthMiddleware);

router.post(
    '/',
    requirePermission(FEE_ASSIGNMENT_PERMISSIONS.CREATE),
    validate(assignFeeSchema),
    assignmentsController.assign
);

router.post(
    '/bulk',
    requirePermission(FEE_ASSIGNMENT_PERMISSIONS.CREATE),
    validate(bulkAssignFeeSchema),
    assignmentsController.bulkAssign
);

router.get(
    '/',
    requirePermission(FEE_ASSIGNMENT_PERMISSIONS.READ),
    validate(listFeeAssignmentsSchema),
    assignmentsController.list
);

router.get(
    '/:id',
    requirePermission(FEE_ASSIGNMENT_PERMISSIONS.READ),
    validate(feeAssignmentIdParamSchema),
    assignmentsController.get
);

export { router as assignmentsRoutes };
