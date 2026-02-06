/**
 * Issues Sub-module Routes
 * NO DELETE ENDPOINT - Issues are immutable
 */
import { Router } from 'express';
import { issuesController } from './issues.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { LIBRARY_ISSUE_PERMISSIONS } from '../library.constants';
import {
    createIssueSchema,
    returnBookSchema,
    issueIdParamSchema,
    listIssuesSchema,
} from '../library.validator';

const router = Router();

router.use(fullAuthMiddleware);

// Issue a book
router.post(
    '/',
    requirePermission(LIBRARY_ISSUE_PERMISSIONS.CREATE),
    validate(createIssueSchema),
    issuesController.create
);

// List issues
router.get(
    '/',
    requirePermission(LIBRARY_ISSUE_PERMISSIONS.READ),
    validate(listIssuesSchema),
    issuesController.list
);

// Get issue by ID
router.get(
    '/:id',
    requirePermission(LIBRARY_ISSUE_PERMISSIONS.READ),
    validate(issueIdParamSchema),
    issuesController.get
);

// Return a book
router.post(
    '/:id/return',
    requirePermission(LIBRARY_ISSUE_PERMISSIONS.RETURN),
    validate(returnBookSchema),
    issuesController.return
);

// NO DELETE ROUTE - Issues are append-only for audit

export { router as issuesRoutes };
