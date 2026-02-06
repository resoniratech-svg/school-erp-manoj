/**
 * Academic Module Routes
 * Consolidated router for all academic sub-modules
 */
import { Router } from 'express';
import { academicYearsRoutes } from './academic-years';
import { classesRoutes } from './classes';
import { sectionsRoutes } from './sections';
import { subjectsRoutes } from './subjects';
import { ROUTE_NAMES } from './academic.constants';

const router = Router();

// Mount sub-module routes
router.use(ROUTE_NAMES.YEARS, academicYearsRoutes);
router.use(ROUTE_NAMES.CLASSES, classesRoutes);
router.use(ROUTE_NAMES.SECTIONS, sectionsRoutes);
router.use(ROUTE_NAMES.SUBJECTS, subjectsRoutes);

export { router as academicRoutes };



