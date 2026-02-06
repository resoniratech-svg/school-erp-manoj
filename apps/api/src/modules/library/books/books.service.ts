/**
 * Books Sub-module Service
 */
import { libraryService } from '../library.service';
import type { BookResponse, LibraryContext } from '../library.types';
import type { CreateBookInput, UpdateBookInput } from '../library.validator';

export class BooksService {
    async create(input: CreateBookInput, context: LibraryContext): Promise<BookResponse> {
        return libraryService.createBook(input, context);
    }

    async getById(id: string, context: LibraryContext): Promise<BookResponse> {
        return libraryService.getBookById(id, context);
    }

    async list(
        filters: { category?: string; status?: string; search?: string },
        context: LibraryContext
    ): Promise<BookResponse[]> {
        return libraryService.listBooks(filters, context);
    }

    async update(id: string, input: UpdateBookInput, context: LibraryContext): Promise<BookResponse> {
        return libraryService.updateBook(id, input, context);
    }

    async delete(id: string, context: LibraryContext): Promise<void> {
        return libraryService.deleteBook(id, context);
    }
}

export const booksService = new BooksService();
