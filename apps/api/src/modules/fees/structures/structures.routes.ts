/**
 * Fee Structures Routes
 */
import { Router } from 'express';
import { structuresController } from './structures.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { FEE_STRUCTURE_PERMISSIONS } from '../fees.constants';
import {
    createFeeStructureSchema,
    updateFeeStructureSchema,
    feeStructureIdParamSchema,
    listFeeStructuresSchema,
} from '../fees.validator';

const router = Router();

router.use(fullAuthMiddleware);

router.post(
    '/',
    requirePermission(FEE_STRUCTURE_PERMISSIONS.CREATE),
    validate(createFeeStructureSchema),
    structuresController.create
);

router.get(
    '/',
    requirePermission(FEE_STRUCTURE_PERMISSIONS.READ),
    validate(listFeeStructuresSchema),
    structuresController.list
);

router.get(
    '/:id',
    requirePermission(FEE_STRUCTURE_PERMISSIONS.READ),
    validate(feeStructureIdParamSchema),
    structuresController.get
);

router.patch(
    '/:id',
    requirePermission(FEE_STRUCTURE_PERMISSIONS.UPDATE),
    validate(updateFeeStructureSchema),
    structuresController.update
);

export { router as structuresRoutes };
