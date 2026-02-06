/**
 * Library Module Service
 * CRITICAL: Append-only issues, fine calculation, copy management
 */
import { NotFoundError, ConflictError } from '@school-erp/shared';
import { LibraryRepository, libraryRepository } from './library.repository';
import {
    LIBRARY_ERROR_CODES,
    ISSUE_STATUS,
    BORROWER_TYPE,
    FINE_CONFIG,
} from './library.constants';
import { mapBookToResponse, mapIssueToResponse } from './library.mapper';
import type {
    BookResponse,
    IssueResponse,
    LibraryContext,
    FineCalculation,
} from './library.types';
import type {
    CreateBookInput,
    UpdateBookInput,
    CreateIssueInput,
    ReturnBookInput,
} from './library.validator';
import { getLogger } from '../../utils/logger';

const logger = getLogger('library-service');

export class LibraryService {
    constructor(private readonly repository: LibraryRepository = libraryRepository) { }

    // ==================== BOOKS ====================

    async createBook(
        input: CreateBookInput,
        context: LibraryContext
    ): Promise<BookResponse> {
        const book = await this.repository.createBook(
            input,
            context.tenantId,
            context.branchId,
            context.userId
        );

        logger.info(`Book created: ${book.id} - ${book.title}`);
        return mapBookToResponse(book, input.totalCopies);
    }

    async getBookById(id: string, context: LibraryContext): Promise<BookResponse> {
        const book = await this.repository.findBookById(id, context.tenantId, context.branchId);
        if (!book) {
            throw new NotFoundError(LIBRARY_ERROR_CODES.BOOK_NOT_FOUND);
        }

        const availableCopies = await this.repository.getAvailableCopies(id);
        return mapBookToResponse(book, availableCopies);
    }

    async listBooks(
        filters: { category?: string; status?: string; search?: string },
        context: LibraryContext
    ): Promise<BookResponse[]> {
        const books = await this.repository.findBooks(context.tenantId, context.branchId, filters);

        const results: BookResponse[] = [];
        for (const book of books) {
            const availableCopies = await this.repository.getAvailableCopies(book.id);
            results.push(mapBookToResponse(book, availableCopies));
        }

        return results;
    }

    async updateBook(
        id: string,
        input: UpdateBookInput,
        context: LibraryContext
    ): Promise<BookResponse> {
        const existing = await this.repository.findBookById(id, context.tenantId, context.branchId);
        if (!existing) {
            throw new NotFoundError(LIBRARY_ERROR_CODES.BOOK_NOT_FOUND);
        }

        // CRITICAL: Cannot reduce total copies below issued count
        if (input.totalCopies !== undefined) {
            const activeIssues = await this.repository.countActiveIssuesForBook(id);
            if (input.totalCopies < activeIssues) {
                throw new ConflictError(
                    `Cannot reduce total copies to ${input.totalCopies}. Currently ${activeIssues} copies are issued.`
                );
            }
        }

        const updated = await this.repository.updateBook(id, input);
        const availableCopies = await this.repository.getAvailableCopies(id);

        logger.info(`Book updated: ${id}`);
        return mapBookToResponse(updated, availableCopies);
    }

    async deleteBook(id: string, context: LibraryContext): Promise<void> {
        const existing = await this.repository.findBookById(id, context.tenantId, context.branchId);
        if (!existing) {
            throw new NotFoundError(LIBRARY_ERROR_CODES.BOOK_NOT_FOUND);
        }

        // Check for active issues
        const activeIssues = await this.repository.countActiveIssuesForBook(id);
        if (activeIssues > 0) {
            throw new ConflictError(
                `Cannot delete book with ${activeIssues} active issues`
            );
        }

        await this.repository.softDeleteBook(id);
        logger.info(`Book deleted: ${id}`);
    }

    // ==================== ISSUES ====================

    async createIssue(
        input: CreateIssueInput,
        context: LibraryContext
    ): Promise<IssueResponse> {
        // Validate book exists and has copies available
        const book = await this.repository.findBookById(
            input.bookId,
            context.tenantId,
            context.branchId
        );
        if (!book) {
            throw new NotFoundError(LIBRARY_ERROR_CODES.BOOK_NOT_FOUND);
        }

        const availableCopies = await this.repository.getAvailableCopies(input.bookId);
        if (availableCopies <= 0) {
            throw new ConflictError(LIBRARY_ERROR_CODES.BOOK_OUT_OF_STOCK);
        }

        // Validate borrower exists
        let borrowerName = '';
        if (input.borrowerType === BORROWER_TYPE.STUDENT) {
            const student = await this.repository.findStudentById(input.borrowerId, context.tenantId);
            if (!student) {
                throw new NotFoundError(LIBRARY_ERROR_CODES.BORROWER_NOT_FOUND);
            }
            borrowerName = `${student.firstName} ${student.lastName}`;
        } else {
            const staff = await this.repository.findStaffById(input.borrowerId, context.tenantId);
            if (!staff) {
                throw new NotFoundError(LIBRARY_ERROR_CODES.BORROWER_NOT_FOUND);
            }
            borrowerName = `${staff.firstName} ${staff.lastName}`;
        }

        const issue = await this.repository.createIssue(
            {
                bookId: input.bookId,
                borrowerId: input.borrowerId,
                borrowerType: input.borrowerType,
                issueDate: new Date(),
                dueDate: new Date(input.dueDate),
            },
            context.tenantId,
            context.branchId,
            context.userId
        );

        logger.info(`Book issued: ${issue.id} - ${book.title} to ${borrowerName}`);
        return mapIssueToResponse(issue, borrowerName);
    }

    async getIssueById(id: string, context: LibraryContext): Promise<IssueResponse> {
        const issue = await this.repository.findIssueById(id, context.tenantId, context.branchId);
        if (!issue) {
            throw new NotFoundError(LIBRARY_ERROR_CODES.ISSUE_NOT_FOUND);
        }

        const borrowerName = await this.getBorrowerName(issue.borrowerId, issue.borrowerType, context.tenantId);
        return mapIssueToResponse(issue, borrowerName);
    }

    async listIssues(
        filters: { bookId?: string; borrowerId?: string; borrowerType?: string; status?: string; overdue?: string },
        context: LibraryContext
    ): Promise<IssueResponse[]> {
        const issues = await this.repository.findIssues(
            context.tenantId,
            context.branchId,
            {
                ...filters,
                overdue: filters.overdue === 'true',
            }
        );

        const results: IssueResponse[] = [];
        for (const issue of issues) {
            const borrowerName = await this.getBorrowerName(issue.borrowerId, issue.borrowerType, context.tenantId);
            results.push(mapIssueToResponse(issue, borrowerName));
        }

        return results;
    }

    async returnBook(
        id: string,
        input: ReturnBookInput,
        context: LibraryContext
    ): Promise<IssueResponse> {
        const issue = await this.repository.findIssueById(id, context.tenantId, context.branchId);
        if (!issue) {
            throw new NotFoundError(LIBRARY_ERROR_CODES.ISSUE_NOT_FOUND);
        }

        if (issue.status !== ISSUE_STATUS.ISSUED) {
            throw new ConflictError(LIBRARY_ERROR_CODES.ALREADY_RETURNED);
        }

        const returnDate = input.returnDate ? new Date(input.returnDate) : new Date();
        const fineCalc = this.calculateFine(issue.dueDate, returnDate, input.isLost);

        const updated = await this.repository.returnIssue(id, {
            returnDate,
            status: input.isLost ? ISSUE_STATUS.LOST : ISSUE_STATUS.RETURNED,
            fineAmount: fineCalc.fineAmount,
            fineReason: fineCalc.fineReason,
        });

        const borrowerName = await this.getBorrowerName(issue.borrowerId, issue.borrowerType, context.tenantId);

        logger.info(`Book returned: ${id}, Fine: ${fineCalc.fineAmount}`);
        return mapIssueToResponse(updated, borrowerName);
    }

    // NO DELETE METHOD - Issues are APPEND-ONLY for audit

    // ==================== HELPERS ====================

    private calculateFine(dueDate: Date, returnDate: Date, isLost?: boolean): FineCalculation {
        if (isLost) {
            // Lost book fine (typically higher)
            return {
                daysLate: 0,
                fineAmount: FINE_CONFIG.DEFAULT_RATE_PER_DAY * FINE_CONFIG.MAX_FINE_DAYS,
                fineReason: 'Book reported as lost',
            };
        }

        const diffTime = returnDate.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= FINE_CONFIG.GRACE_PERIOD_DAYS) {
            return { daysLate: 0, fineAmount: 0, fineReason: null };
        }

        const daysLate = Math.min(diffDays - FINE_CONFIG.GRACE_PERIOD_DAYS, FINE_CONFIG.MAX_FINE_DAYS);
        const fineAmount = daysLate * FINE_CONFIG.DEFAULT_RATE_PER_DAY;

        return {
            daysLate,
            fineAmount,
            fineReason: daysLate > 0 ? `Late return by ${daysLate} days` : null,
        };
    }

    private async getBorrowerName(borrowerId: string, borrowerType: string, tenantId: string): Promise<string> {
        if (borrowerType === BORROWER_TYPE.STUDENT) {
            const student = await this.repository.findStudentById(borrowerId, tenantId);
            return student ? `${student.firstName} ${student.lastName}` : '';
        } else {
            const staff = await this.repository.findStaffById(borrowerId, tenantId);
            return staff ? `${staff.firstName} ${staff.lastName}` : '';
        }
    }
}

export const libraryService = new LibraryService();
