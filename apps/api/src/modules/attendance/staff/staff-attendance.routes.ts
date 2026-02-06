/**
 * Staff Attendance Routes
 */
import { Router } from 'express';
import { staffAttendanceController } from './staff-attendance.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { STAFF_ATTENDANCE_PERMISSIONS } from './staff-attendance.constants';
import {
    markStaffAttendanceSchema,
    updateStaffAttendanceSchema,
    staffAttendanceIdParamSchema,
    listStaffAttendanceSchema,
} from './staff-attendance.validator';

const router = Router();

// Apply auth middleware
router.use(fullAuthMiddleware);

// Mark staff attendance
router.post(
    '/',
    requirePermission(STAFF_ATTENDANCE_PERMISSIONS.CREATE),
    validate(markStaffAttendanceSchema),
    staffAttendanceController.markAttendance
);

// List staff attendance
router.get(
    '/',
    requirePermission(STAFF_ATTENDANCE_PERMISSIONS.READ),
    validate(listStaffAttendanceSchema),
    staffAttendanceController.listAttendance
);

// Get staff attendance by ID
router.get(
    '/:id',
    requirePermission(STAFF_ATTENDANCE_PERMISSIONS.READ),
    validate(staffAttendanceIdParamSchema),
    staffAttendanceController.getAttendance
);

// Update staff attendance
router.patch(
    '/:id',
    requirePermission(STAFF_ATTENDANCE_PERMISSIONS.UPDATE),
    validate(updateStaffAttendanceSchema),
    staffAttendanceController.updateAttendance
);

export { router as staffAttendanceRoutes };
