/**
 * Academic Years Routes
 * Express router with RBAC middleware
 */
import { Router } from 'express';
import { academicYearsController } from './academic-years.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { ACADEMIC_YEAR_PERMISSIONS } from './academic-years.constants';
import {
    createAcademicYearSchema,
    updateAcademicYearSchema,
    academicYearIdParamSchema,
    listAcademicYearsSchema,
} from './academic-years.validator';

const router = Router();

// Apply auth middleware to all routes
router.use(fullAuthMiddleware);

// Create academic year
router.post(
    '/',
    requirePermission(ACADEMIC_YEAR_PERMISSIONS.CREATE),
    validate(createAcademicYearSchema),
    academicYearsController.createAcademicYear
);

// List academic years
router.get(
    '/',
    requirePermission(ACADEMIC_YEAR_PERMISSIONS.READ),
    validate(listAcademicYearsSchema),
    academicYearsController.listAcademicYears
);

// Get academic year by ID
router.get(
    '/:id',
    requirePermission(ACADEMIC_YEAR_PERMISSIONS.READ),
    validate(academicYearIdParamSchema),
    academicYearsController.getAcademicYear
);

// Update academic year
router.patch(
    '/:id',
    requirePermission(ACADEMIC_YEAR_PERMISSIONS.UPDATE),
    validate(updateAcademicYearSchema),
    academicYearsController.updateAcademicYear
);

// Delete academic year
router.delete(
    '/:id',
    requirePermission(ACADEMIC_YEAR_PERMISSIONS.DELETE),
    validate(academicYearIdParamSchema),
    academicYearsController.deleteAcademicYear
);

// Activate academic year (set as current)
router.post(
    '/:id/activate',
    requirePermission(ACADEMIC_YEAR_PERMISSIONS.ACTIVATE),
    validate(academicYearIdParamSchema),
    academicYearsController.activateAcademicYear
);

export { router as academicYearsRoutes };
