/**
 * Library Module Constants
 */
import { createPermission } from '@school-erp/shared';

// Permissions
export const LIBRARY_BOOK_PERMISSIONS = {
    CREATE: createPermission('library_book', 'create', 'branch'),
    READ: createPermission('library_book', 'read', 'branch'),
    UPDATE: createPermission('library_book', 'update', 'branch'),
    DELETE: createPermission('library_book', 'delete', 'branch'),
} as const;

export const LIBRARY_ISSUE_PERMISSIONS = {
    CREATE: createPermission('library_issue', 'create', 'branch'),
    READ: createPermission('library_issue', 'read', 'branch'),
    RETURN: createPermission('library_issue', 'return', 'branch'),
} as const;

// Book Status
export const BOOK_STATUS = {
    ACTIVE: 'active',
    DISCONTINUED: 'discontinued',
} as const;

// Issue Status
export const ISSUE_STATUS = {
    ISSUED: 'issued',
    RETURNED: 'returned',
    LOST: 'lost',
} as const;

// Borrower Type
export const BORROWER_TYPE = {
    STUDENT: 'student',
    STAFF: 'staff',
} as const;

// Fine Configuration (per day in currency units)
export const FINE_CONFIG = {
    DEFAULT_RATE_PER_DAY: 5,
    MAX_FINE_DAYS: 30,
    GRACE_PERIOD_DAYS: 0,
} as const;

// Book Categories
export const BOOK_CATEGORY = {
    TEXTBOOK: 'textbook',
    REFERENCE: 'reference',
    FICTION: 'fiction',
    NON_FICTION: 'non_fiction',
    PERIODICAL: 'periodical',
    MAGAZINE: 'magazine',
    OTHER: 'other',
} as const;

// Error Codes
export const LIBRARY_ERROR_CODES = {
    BOOK_NOT_FOUND: 'LIBRARY_BOOK_NOT_FOUND',
    BOOK_OUT_OF_STOCK: 'BOOK_OUT_OF_STOCK',
    CANNOT_REDUCE_COPIES: 'CANNOT_REDUCE_COPIES_BELOW_ISSUED',
    ISSUE_NOT_FOUND: 'LIBRARY_ISSUE_NOT_FOUND',
    ALREADY_RETURNED: 'BOOK_ALREADY_RETURNED',
    BORROWER_NOT_FOUND: 'BORROWER_NOT_FOUND',
    CROSS_BRANCH_FORBIDDEN: 'CROSS_BRANCH_FORBIDDEN',
    DELETE_NOT_ALLOWED: 'DELETE_NOT_ALLOWED',
} as const;
