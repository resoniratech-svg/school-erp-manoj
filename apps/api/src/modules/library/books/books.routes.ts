/**
 * Books Sub-module Routes
 */
import { Router } from 'express';
import { booksController } from './books.controller';
import { validate } from '../../../middleware/validate';
import { fullAuthMiddleware, requirePermission } from '../../authz';
import { LIBRARY_BOOK_PERMISSIONS } from '../library.constants';
import {
    createBookSchema,
    updateBookSchema,
    bookIdParamSchema,
    listBooksSchema,
} from '../library.validator';

const router = Router();

router.use(fullAuthMiddleware);

router.post(
    '/',
    requirePermission(LIBRARY_BOOK_PERMISSIONS.CREATE),
    validate(createBookSchema),
    booksController.create
);

router.get(
    '/',
    requirePermission(LIBRARY_BOOK_PERMISSIONS.READ),
    validate(listBooksSchema),
    booksController.list
);

router.get(
    '/:id',
    requirePermission(LIBRARY_BOOK_PERMISSIONS.READ),
    validate(bookIdParamSchema),
    booksController.get
);

router.patch(
    '/:id',
    requirePermission(LIBRARY_BOOK_PERMISSIONS.UPDATE),
    validate(updateBookSchema),
    booksController.update
);

router.delete(
    '/:id',
    requirePermission(LIBRARY_BOOK_PERMISSIONS.DELETE),
    validate(bookIdParamSchema),
    booksController.delete
);

export { router as booksRoutes };
