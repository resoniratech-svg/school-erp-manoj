/**
 * Attendance Routes
 * Express router with RBAC middleware
 */
import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { validate } from '../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../authz';
import { ATTENDANCE_PERMISSIONS } from './attendance.constants';
import {
    bulkMarkAttendanceSchema,
    updateAttendanceSchema,
    attendanceIdParamSchema,
    listAttendanceSchema,
    sectionDateParamsSchema,
    studentSummaryParamsSchema,
} from './attendance.validator';

const router = Router();

// Apply auth middleware to all routes
router.use(fullAuthMiddleware);

// Bulk mark attendance
router.post(
    '/students',
    requirePermission(ATTENDANCE_PERMISSIONS.CREATE),
    validate(bulkMarkAttendanceSchema),
    attendanceController.bulkMarkAttendance
);

// List attendance
router.get(
    '/students',
    requirePermission(ATTENDANCE_PERMISSIONS.READ),
    validate(listAttendanceSchema),
    attendanceController.listAttendance
);

// Get attendance by section and date
router.get(
    '/students/section/:sectionId/date/:date',
    requirePermission(ATTENDANCE_PERMISSIONS.READ),
    validate(sectionDateParamsSchema),
    attendanceController.getAttendanceBySectionDate
);

// Get student summary
router.get(
    '/students/:studentId/summary',
    requirePermission(ATTENDANCE_PERMISSIONS.READ),
    validate(studentSummaryParamsSchema),
    attendanceController.getStudentSummary
);

// Get attendance by ID
router.get(
    '/students/:id',
    requirePermission(ATTENDANCE_PERMISSIONS.READ),
    validate(attendanceIdParamSchema),
    attendanceController.getAttendance
);

// Update attendance (correction)
router.patch(
    '/students/:id',
    requirePermission(ATTENDANCE_PERMISSIONS.UPDATE),
    validate(updateAttendanceSchema),
    attendanceController.updateAttendance
);

export { router as studentAttendanceRoutes };
