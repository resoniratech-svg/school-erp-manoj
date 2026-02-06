/**
 * Issues Service Unit Tests
 * CRITICAL: Tests for append-only, stock checks, and fine calculation
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { LibraryService } from '../library.service';
import type { LibraryRepository } from '../library.repository';
import { ISSUE_STATUS, LIBRARY_ERROR_CODES, FINE_CONFIG, BORROWER_TYPE } from '../library.constants';

describe('LibraryService - Issues', () => {
    let service: LibraryService;
    let mockRepository: {
        findBookById: Mock;
        findIssueById: Mock;
        findIssues: Mock;
        createIssue: Mock;
        returnIssue: Mock;
        getAvailableCopies: Mock;
        findStudentById: Mock;
        findStaffById: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        totalCopies: 10,
        branchId: 'branch-456',
        tenantId: 'tenant-123',
    };

    const mockStudent = {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: 'tenant-123',
    };

    const mockIssue = {
        id: 'issue-1',
        bookId: 'book-1',
        borrowerId: 'student-1',
        borrowerType: BORROWER_TYPE.STUDENT,
        issueDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-15'),
        returnDate: null,
        status: ISSUE_STATUS.ISSUED,
        fineAmount: 0,
        fineReason: null,
        branchId: 'branch-456',
        tenantId: 'tenant-123',
        book: { title: 'Test Book' },
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        mockRepository = {
            findBookById: vi.fn(),
            findIssueById: vi.fn(),
            findIssues: vi.fn(),
            createIssue: vi.fn(),
            returnIssue: vi.fn(),
            getAvailableCopies: vi.fn(),
            findStudentById: vi.fn(),
            findStaffById: vi.fn(),
        };

        service = new LibraryService(mockRepository as unknown as LibraryRepository);
    });

    describe('createIssue', () => {
        it('should issue book when copies available', async () => {
            mockRepository.findBookById.mockResolvedValue(mockBook);
            mockRepository.getAvailableCopies.mockResolvedValue(5); // Copies available
            mockRepository.findStudentById.mockResolvedValue(mockStudent);
            mockRepository.createIssue.mockResolvedValue(mockIssue);

            const result = await service.createIssue(
                {
                    bookId: 'book-1',
                    borrowerId: 'student-1',
                    borrowerType: BORROWER_TYPE.STUDENT,
                    dueDate: '2024-12-31',
                },
                mockContext
            );

            expect(result.bookId).toBe('book-1');
            expect(result.status).toBe(ISSUE_STATUS.ISSUED);
        });

        it('should reject when out of stock', async () => {
            mockRepository.findBookById.mockResolvedValue(mockBook);
            mockRepository.getAvailableCopies.mockResolvedValue(0); // No copies available

            await expect(
                service.createIssue(
                    {
                        bookId: 'book-1',
                        borrowerId: 'student-1',
                        borrowerType: BORROWER_TYPE.STUDENT,
                        dueDate: '2024-12-31',
                    },
                    mockContext
                )
            ).rejects.toThrow(LIBRARY_ERROR_CODES.BOOK_OUT_OF_STOCK);
        });
    });

    describe('returnBook - fine calculation', () => {
        it('should calculate fine correctly for late return', async () => {
            const dueDate = new Date('2024-01-15');
            const returnDate = new Date('2024-01-20'); // 5 days late

            mockRepository.findIssueById.mockResolvedValue({
                ...mockIssue,
                dueDate,
            });
            mockRepository.returnIssue.mockImplementation((_id, data) =>
                Promise.resolve({
                    ...mockIssue,
                    ...data,
                    book: { title: 'Test Book' },
                })
            );
            mockRepository.findStudentById.mockResolvedValue(mockStudent);

            const result = await service.returnBook(
                'issue-1',
                { returnDate: '2024-01-20' },
                mockContext
            );

            const expectedFine = 5 * FINE_CONFIG.DEFAULT_RATE_PER_DAY;
            expect(result.fineAmount).toBe(expectedFine);
            expect(result.status).toBe(ISSUE_STATUS.RETURNED);
        });

        it('should not charge fine for on-time return', async () => {
            const dueDate = new Date('2024-01-15');

            mockRepository.findIssueById.mockResolvedValue({
                ...mockIssue,
                dueDate,
            });
            mockRepository.returnIssue.mockImplementation((_id, data) =>
                Promise.resolve({
                    ...mockIssue,
                    ...data,
                    book: { title: 'Test Book' },
                })
            );
            mockRepository.findStudentById.mockResolvedValue(mockStudent);

            const result = await service.returnBook(
                'issue-1',
                { returnDate: '2024-01-10' }, // Before due date
                mockContext
            );

            expect(result.fineAmount).toBe(0);
        });

        it('should handle lost book with max fine', async () => {
            mockRepository.findIssueById.mockResolvedValue(mockIssue);
            mockRepository.returnIssue.mockImplementation((_id, data) =>
                Promise.resolve({
                    ...mockIssue,
                    ...data,
                    book: { title: 'Test Book' },
                })
            );
            mockRepository.findStudentById.mockResolvedValue(mockStudent);

            const result = await service.returnBook(
                'issue-1',
                { isLost: true },
                mockContext
            );

            const expectedFine = FINE_CONFIG.DEFAULT_RATE_PER_DAY * FINE_CONFIG.MAX_FINE_DAYS;
            expect(result.fineAmount).toBe(expectedFine);
            expect(result.status).toBe(ISSUE_STATUS.LOST);
        });
    });

    describe('append-only enforcement', () => {
        it('should not have delete method exposed', () => {
            expect((service as unknown as { deleteIssue?: unknown }).deleteIssue).toBeUndefined();
        });
    });

    describe('cross-branch rejection', () => {
        it('should reject issue from different branch', async () => {
            mockRepository.findIssueById.mockResolvedValue(null);

            await expect(
                service.getIssueById('issue-other', mockContext)
            ).rejects.toThrow(LIBRARY_ERROR_CODES.ISSUE_NOT_FOUND);
        });
    });
});
