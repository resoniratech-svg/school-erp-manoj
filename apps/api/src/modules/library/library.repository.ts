/**
 * Library Module Repository
 * CRITICAL: No delete for issues - append-only
 */
import { prisma } from '@school-erp/database';
import { BOOK_STATUS, ISSUE_STATUS } from './library.constants';
import type {
    CreateBookInput,
    UpdateBookInput,
    CreateIssueInput,
} from './library.validator';

export class LibraryRepository {
    // ==================== BOOKS ====================

    async findBookById(id: string, tenantId: string, branchId: string) {
        return prisma.libraryBook.findFirst({
            where: { id, tenantId, branchId, deletedAt: null },
        });
    }

    async findBooks(
        tenantId: string,
        branchId: string,
        filters: { category?: string; status?: string; search?: string }
    ) {
        return prisma.libraryBook.findMany({
            where: {
                tenantId,
                branchId,
                deletedAt: null,
                ...(filters.category && { category: filters.category }),
                ...(filters.status && { status: filters.status }),
                ...(filters.search && {
                    OR: [
                        { title: { contains: filters.search, mode: 'insensitive' } },
                        { author: { contains: filters.search, mode: 'insensitive' } },
                        { isbn: { contains: filters.search, mode: 'insensitive' } },
                    ],
                }),
            },
            orderBy: { title: 'asc' },
        });
    }

    async createBook(
        data: CreateBookInput,
        tenantId: string,
        branchId: string,
        createdByUserId: string
    ) {
        return prisma.libraryBook.create({
            data: {
                ...data,
                tenantId,
                branchId,
                status: BOOK_STATUS.ACTIVE,
                createdByUserId,
            },
        });
    }

    async updateBook(id: string, data: UpdateBookInput) {
        return prisma.libraryBook.update({
            where: { id },
            data,
        });
    }

    async softDeleteBook(id: string) {
        return prisma.libraryBook.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async countActiveIssuesForBook(bookId: string): Promise<number> {
        return prisma.libraryIssue.count({
            where: {
                bookId,
                status: ISSUE_STATUS.ISSUED,
            },
        });
    }

    // ==================== ISSUES ====================

    async findIssueById(id: string, tenantId: string, branchId: string) {
        return prisma.libraryIssue.findFirst({
            where: { id, tenantId, branchId },
            include: {
                book: true,
            },
        });
    }

    async findIssues(
        tenantId: string,
        branchId: string,
        filters: { bookId?: string; borrowerId?: string; borrowerType?: string; status?: string; overdue?: boolean }
    ) {
        const now = new Date();
        return prisma.libraryIssue.findMany({
            where: {
                tenantId,
                branchId,
                ...(filters.bookId && { bookId: filters.bookId }),
                ...(filters.borrowerId && { borrowerId: filters.borrowerId }),
                ...(filters.borrowerType && { borrowerType: filters.borrowerType }),
                ...(filters.status && { status: filters.status }),
                ...(filters.overdue && {
                    status: ISSUE_STATUS.ISSUED,
                    dueDate: { lt: now },
                }),
            },
            include: {
                book: true,
            },
            orderBy: { issueDate: 'desc' },
        });
    }

    async createIssue(
        data: {
            bookId: string;
            borrowerId: string;
            borrowerType: string;
            issueDate: Date;
            dueDate: Date;
        },
        tenantId: string,
        branchId: string,
        createdByUserId: string
    ) {
        return prisma.libraryIssue.create({
            data: {
                ...data,
                tenantId,
                branchId,
                status: ISSUE_STATUS.ISSUED,
                fineAmount: 0,
                createdByUserId,
            },
            include: {
                book: true,
            },
        });
    }

    async returnIssue(
        id: string,
        data: {
            returnDate: Date;
            status: string;
            fineAmount: number;
            fineReason: string | null;
        }
    ) {
        return prisma.libraryIssue.update({
            where: { id },
            data,
            include: {
                book: true,
            },
        });
    }

    // NO DELETE METHOD - Issues are append-only for audit

    // ==================== HELPERS ====================

    async findStudentById(studentId: string, tenantId: string) {
        return prisma.student.findFirst({
            where: { id: studentId, tenantId, deletedAt: null },
        });
    }

    async findStaffById(staffId: string, tenantId: string) {
        return prisma.staff.findFirst({
            where: { id: staffId, tenantId, deletedAt: null },
        });
    }

    async getAvailableCopies(bookId: string): Promise<number> {
        const book = await prisma.libraryBook.findUnique({
            where: { id: bookId },
            select: { totalCopies: true },
        });

        if (!book) return 0;

        const activeIssues = await this.countActiveIssuesForBook(bookId);
        return book.totalCopies - activeIssues;
    }
}

export const libraryRepository = new LibraryRepository();
