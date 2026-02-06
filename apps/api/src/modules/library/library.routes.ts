/**
 * Library Module Routes
 */
import { Router } from 'express';
import { fullAuthMiddleware } from '../authz';
import { booksRoutes } from './books';
import { issuesRoutes } from './issues';

const router = Router();

router.use(fullAuthMiddleware);

// Mount sub-routes
router.use('/books', booksRoutes);
router.use('/issues', issuesRoutes);

export { router as libraryRoutes };
