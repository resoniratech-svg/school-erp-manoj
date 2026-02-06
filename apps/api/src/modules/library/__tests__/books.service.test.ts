/**
 * Books Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { LibraryService } from '../library.service';
import type { LibraryRepository } from '../library.repository';
import { BOOK_STATUS, LIBRARY_ERROR_CODES } from '../library.constants';

describe('LibraryService - Books', () => {
    let service: LibraryService;
    let mockRepository: {
        findBookById: Mock;
        findBooks: Mock;
        createBook: Mock;
        updateBook: Mock;
        softDeleteBook: Mock;
        countActiveIssuesForBook: Mock;
        getAvailableCopies: Mock;
    };

    const mockContext = {
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        userId: 'user-789',
    };

    const mockBook = {
        id: 'book-1',
        isbn: '978-0-123456-78-9',
        title: 'Introduction to Programming',
        author: 'John Doe',
        publisher: 'Tech Books',
        category: 'textbook',
        totalCopies: 10,
        status: BOOK_STATUS.ACTIVE,
        branchId: 'branch-456',
        tenantId: 'tenant-123',
        shelfLocation: 'A1-01',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        mockRepository = {
            findBookById: vi.fn(),
            findBooks: vi.fn(),
            createBook: vi.fn(),
            updateBook: vi.fn(),
            softDeleteBook: vi.fn(),
            countActiveIssuesForBook: vi.fn(),
            getAvailableCopies: vi.fn(),
        };

        service = new LibraryService(mockRepository as unknown as LibraryRepository);
    });

    describe('createBook', () => {
        it('should create book successfully', async () => {
            mockRepository.createBook.mockResolvedValue(mockBook);

            const result = await service.createBook(
                {
                    title: 'Introduction to Programming',
                    author: 'John Doe',
                    category: 'textbook',
                    totalCopies: 10,
                },
                mockContext
            );

            expect(result.title).toBe('Introduction to Programming');
            expect(result.availableCopies).toBe(10);
        });
    });

    describe('updateBook - copy reduction', () => {
        it('should reject reducing copies below issued count', async () => {
            mockRepository.findBookById.mockResolvedValue(mockBook);
            mockRepository.countActiveIssuesForBook.mockResolvedValue(5); // 5 copies issued

            await expect(
                service.updateBook(
                    'book-1',
                    { totalCopies: 3 }, // Trying to reduce to 3
                    mockContext
                )
            ).rejects.toThrow('Cannot reduce total copies to 3. Currently 5 copies are issued.');
        });

        it('should allow reducing copies above issued count', async () => {
            mockRepository.findBookById.mockResolvedValue(mockBook);
            mockRepository.countActiveIssuesForBook.mockResolvedValue(5);
            mockRepository.updateBook.mockResolvedValue({ ...mockBook, totalCopies: 7 });
            mockRepository.getAvailableCopies.mockResolvedValue(2);

            const result = await service.updateBook(
                'book-1',
                { totalCopies: 7 },
                mockContext
            );

            expect(result.totalCopies).toBe(7);
            expect(result.availableCopies).toBe(2);
        });
    });

    describe('cross-branch rejection', () => {
        it('should reject book from different branch', async () => {
            mockRepository.findBookById.mockResolvedValue(null);

            await expect(
                service.getBookById('book-other', mockContext)
            ).rejects.toThrow(LIBRARY_ERROR_CODES.BOOK_NOT_FOUND);
        });
    });
});
