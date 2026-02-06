/**
 * Library Module Types
 */

// Book Response
export interface BookResponse {
    id: string;
    isbn: string | null;
    title: string;
    author: string;
    publisher: string | null;
    category: string;
    totalCopies: number;
    availableCopies: number; // Derived: total - activeIssues
    status: string;
    branchId: string;
    shelfLocation: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Issue Response
export interface IssueResponse {
    id: string;
    bookId: string;
    bookTitle: string;
    borrowerId: string;
    borrowerName: string;
    borrowerType: string;
    issueDate: Date;
    dueDate: Date;
    returnDate: Date | null;
    status: string;
    fineAmount: number;
    fineReason: string | null;
    branchId: string;
    createdAt: Date;
    updatedAt: Date;
}

// Context
export interface LibraryContext {
    tenantId: string;
    branchId: string;
    userId: string;
}

// Create Book Input
export interface CreateBookInput {
    isbn?: string;
    title: string;
    author: string;
    publisher?: string;
    category: string;
    totalCopies: number;
    shelfLocation?: string;
}

// Update Book Input
export interface UpdateBookInput {
    isbn?: string;
    title?: string;
    author?: string;
    publisher?: string;
    category?: string;
    totalCopies?: number;
    shelfLocation?: string;
    status?: string;
}

// Create Issue Input
export interface CreateIssueInput {
    bookId: string;
    borrowerId: string;
    borrowerType: string;
    dueDate: string;
}

// Return Book Input
export interface ReturnBookInput {
    returnDate?: string;
    isLost?: boolean;
}

// Fine Calculation Result
export interface FineCalculation {
    daysLate: number;
    fineAmount: number;
    fineReason: string | null;
}
