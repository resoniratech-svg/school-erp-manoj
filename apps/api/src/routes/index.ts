import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from '../modules/auth';
import { usersRoutes } from '../modules/users';
import { rolesRoutes } from '../modules/roles';
import { academicRoutes } from '../modules/academic';
import { timetableRoutes } from '../modules/timetable';
import { attendanceRoutes } from '../modules/attendance';
import { examsRoutes } from '../modules/exams';
import { reportsRoutes } from '../modules/reports';
import { feesRoutes } from '../modules/fees';
import { communicationRoutes } from '../modules/communication';
import { transportRoutes } from '../modules/transport';
import { libraryRoutes } from '../modules/library';
import { auditRoutes } from '../modules/audit';
import { configRoutes } from '../modules/config';
import { rateLimitRoutes } from '../modules/rate-limit';
import { filesRoutes } from '../modules/files';
import { deliveryRoutes } from '../modules/notification-delivery';
import { jobsRoutes } from '../modules/jobs';
import { observabilityRoutes } from '../modules/observability';

const router = Router();

// Observability (no auth, must be first for k8s probes)
router.use('/', observabilityRoutes);

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/academic', academicRoutes);
router.use('/timetable', timetableRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/exams', examsRoutes);
router.use('/reports', reportsRoutes);
router.use('/fees', feesRoutes);
router.use('/communication', communicationRoutes);
router.use('/transport', transportRoutes);
router.use('/library', libraryRoutes);
router.use('/audit', auditRoutes);
router.use('/config', configRoutes);
router.use('/rate-limit', rateLimitRoutes);
router.use('/files', filesRoutes);
router.use('/notification-delivery', deliveryRoutes);
router.use('/jobs', jobsRoutes);

export { router as apiRoutes };






