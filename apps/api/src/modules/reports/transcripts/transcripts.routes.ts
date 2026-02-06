/**
 * Transcripts Routes
 */
import { Router } from 'express';
import { transcriptsController } from './transcripts.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { TRANSCRIPT_PERMISSIONS } from '../reports.constants';
import { transcriptParamsSchema } from '../reports.validator';

const router = Router();

router.use(fullAuthMiddleware);

// Get transcript for student
router.get(
    '/:studentId',
    requirePermission(TRANSCRIPT_PERMISSIONS.READ),
    validate(transcriptParamsSchema),
    transcriptsController.getTranscript
);

export { router as transcriptsRoutes };
