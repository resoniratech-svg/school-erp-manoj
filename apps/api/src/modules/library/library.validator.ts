/**
 * Library Module Validators
 */
import { z } from 'zod';
import { BOOK_STATUS, BOOK_CATEGORY, BORROWER_TYPE } from './library.constants';

// Create Book
export const createBookSchema = z.object({
    body: z.object({
        isbn: z.string().max(20).optional(),
        title: z.string().min(1).max(200),
        author: z.string().min(1).max(200),
        publisher: z.string().max(200).optional(),
        category: z.enum([
            BOOK_CATEGORY.TEXTBOOK,
            BOOK_CATEGORY.REFERENCE,
            BOOK_CATEGORY.FICTION,
            BOOK_CATEGORY.NON_FICTION,
            BOOK_CATEGORY.PERIODICAL,
            BOOK_CATEGORY.MAGAZINE,
            BOOK_CATEGORY.OTHER,
        ]),
        totalCopies: z.number().int().min(1).max(1000),
        shelfLocation: z.string().max(50).optional(),
    }),
});

// Update Book
export const updateBookSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        isbn: z.string().max(20).optional(),
        title: z.string().min(1).max(200).optional(),
        author: z.string().min(1).max(200).optional(),
        publisher: z.string().max(200).optional(),
        category: z.enum([
            BOOK_CATEGORY.TEXTBOOK,
            BOOK_CATEGORY.REFERENCE,
            BOOK_CATEGORY.FICTION,
            BOOK_CATEGORY.NON_FICTION,
            BOOK_CATEGORY.PERIODICAL,
            BOOK_CATEGORY.MAGAZINE,
            BOOK_CATEGORY.OTHER,
        ]).optional(),
        totalCopies: z.number().int().min(1).max(1000).optional(),
        shelfLocation: z.string().max(50).optional(),
        status: z.enum([BOOK_STATUS.ACTIVE, BOOK_STATUS.DISCONTINUED]).optional(),
    }),
});

// Create Issue
export const createIssueSchema = z.object({
    body: z.object({
        bookId: z.string().uuid(),
        borrowerId: z.string().uuid(),
        borrowerType: z.enum([BORROWER_TYPE.STUDENT, BORROWER_TYPE.STAFF]),
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    }).refine(
        (data) => new Date(data.dueDate) > new Date(),
        { message: 'Due date must be in the future' }
    ),
});

// Return Book
export const returnBookSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
        isLost: z.boolean().optional(),
    }),
});

// Common Params
export const bookIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

export const issueIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

// List Queries
export const listBooksSchema = z.object({
    query: z.object({
        category: z.enum([
            BOOK_CATEGORY.TEXTBOOK,
            BOOK_CATEGORY.REFERENCE,
            BOOK_CATEGORY.FICTION,
            BOOK_CATEGORY.NON_FICTION,
            BOOK_CATEGORY.PERIODICAL,
            BOOK_CATEGORY.MAGAZINE,
            BOOK_CATEGORY.OTHER,
        ]).optional(),
        status: z.enum([BOOK_STATUS.ACTIVE, BOOK_STATUS.DISCONTINUED]).optional(),
        search: z.string().max(100).optional(),
    }),
});

export const listIssuesSchema = z.object({
    query: z.object({
        bookId: z.string().uuid().optional(),
        borrowerId: z.string().uuid().optional(),
        borrowerType: z.enum([BORROWER_TYPE.STUDENT, BORROWER_TYPE.STAFF]).optional(),
        status: z.string().optional(),
        overdue: z.enum(['true', 'false']).optional(),
    }),
});

// Type exports
export type CreateBookInput = z.infer<typeof createBookSchema>['body'];
export type UpdateBookInput = z.infer<typeof updateBookSchema>['body'];
export type CreateIssueInput = z.infer<typeof createIssueSchema>['body'];
export type ReturnBookInput = z.infer<typeof returnBookSchema>['body'];
