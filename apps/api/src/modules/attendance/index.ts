/**
 * Attendance Module Barrel Export
 */
import { Router } from 'express';
import { studentAttendanceRoutes } from './attendance.routes';
import { staffAttendanceRoutes } from './staff';

const router = Router();

// Mount sub-routes
router.use('/', studentAttendanceRoutes);
router.use('/staff', staffAttendanceRoutes);

export { router as attendanceRoutes };
export { attendanceService } from './attendance.service';
export { attendanceController } from './attendance.controller';
export * from './attendance.types';
export * from './attendance.constants';

// Re-export staff attendance
export * from './staff';
