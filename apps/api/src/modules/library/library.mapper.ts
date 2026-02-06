/**
 * Library Module Mapper
 */
import type { BookResponse, IssueResponse } from './library.types';

type BookRecord = {
    id: string;
    isbn: string | null;
    title: string;
    author: string;
    publisher: string | null;
    category: string;
    totalCopies: number;
    status: string;
    branchId: string;
    shelfLocation: string | null;
    createdAt: Date;
    updatedAt: Date;
};

type IssueWithBook = {
    id: string;
    bookId: string;
    borrowerId: string;
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
    book?: { title: string };
};

export function mapBookToResponse(
    book: BookRecord,
    availableCopies: number
): BookResponse {
    return {
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        category: book.category,
        totalCopies: book.totalCopies,
        availableCopies,
        status: book.status,
        branchId: book.branchId,
        shelfLocation: book.shelfLocation,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
    };
}

export function mapIssueToResponse(
    issue: IssueWithBook,
    borrowerName: string = ''
): IssueResponse {
    return {
        id: issue.id,
        bookId: issue.bookId,
        bookTitle: issue.book?.title || '',
        borrowerId: issue.borrowerId,
        borrowerName,
        borrowerType: issue.borrowerType,
        issueDate: issue.issueDate,
        dueDate: issue.dueDate,
        returnDate: issue.returnDate,
        status: issue.status,
        fineAmount: issue.fineAmount,
        fineReason: issue.fineReason,
        branchId: issue.branchId,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
    };
}
