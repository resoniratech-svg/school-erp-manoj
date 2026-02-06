/**
 * Library Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse, PaginatedResponse } from '../types/api-response';
import { buildQueryParams, type QueryParams } from '../types/pagination';

// Types
export interface Book {
    id: string;
    isbn?: string;
    title: string;
    author: string;
    category?: string;
    totalCopies: number;
    availableCopies: number;
    branchId: string;
}

export interface BookIssue {
    id: string;
    bookId: string;
    borrowerId: string;
    borrowerType: string;
    issueDate: string;
    dueDate: string;
    returnDate?: string;
    fine?: number;
    status: 'issued' | 'returned' | 'overdue';
    book?: { id: string; title: string };
    borrower?: { id: string; name: string };
}

export interface CreateBookInput {
    isbn?: string;
    title: string;
    author: string;
    category?: string;
    totalCopies: number;
}

/**
 * Library Client
 */
export const libraryClient = {
    /**
     * Books
     */
    books: {
        async list(params?: QueryParams & { category?: string; search?: string }): Promise<PaginatedResponse<Book>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<Book>>(
                `/api/v1/library/books${query}`
            );
            return response.data;
        },

        async get(id: string): Promise<Book> {
            const response = await apiClient.get<ApiResponse<Book>>(
                `/api/v1/library/books/${id}`
            );
            return response.data.data;
        },

        async create(data: CreateBookInput): Promise<Book> {
            const response = await apiClient.post<ApiResponse<Book>>(
                '/api/v1/library/books',
                data
            );
            return response.data.data;
        },

        async update(id: string, data: Partial<CreateBookInput>): Promise<Book> {
            const response = await apiClient.patch<ApiResponse<Book>>(
                `/api/v1/library/books/${id}`,
                data
            );
            return response.data.data;
        },

        async searchByIsbn(isbn: string): Promise<Book | null> {
            const response = await apiClient.get<ApiResponse<Book | null>>(
                `/api/v1/library/books/isbn/${isbn}`
            );
            return response.data.data;
        },

        async delete(id: string): Promise<void> {
            await apiClient.delete(`/api/v1/library/books/${id}`);
        },
    },

    /**
     * Issues
     */
    issues: {
        async list(params?: QueryParams & { borrowerId?: string; status?: string }): Promise<PaginatedResponse<BookIssue>> {
            const query = buildQueryParams(params || {});
            const response = await apiClient.get<PaginatedResponse<BookIssue>>(
                `/api/v1/library/issues${query}`
            );
            return response.data;
        },

        async create(data: {
            bookId: string;
            borrowerId: string;
            borrowerType: string;
            dueDate: string;
        }): Promise<BookIssue> {
            const response = await apiClient.post<ApiResponse<BookIssue>>(
                '/api/v1/library/issues',
                data
            );
            return response.data.data;
        },

        async return(issueId: string): Promise<BookIssue> {
            const response = await apiClient.post<ApiResponse<BookIssue>>(
                `/api/v1/library/issues/${issueId}/return`
            );
            return response.data.data;
        },

        async getByBorrower(borrowerId: string): Promise<BookIssue[]> {
            const response = await apiClient.get<ApiResponse<BookIssue[]>>(
                `/api/v1/library/issues/borrower/${borrowerId}`
            );
            return response.data.data;
        },

        async getOverdue(): Promise<BookIssue[]> {
            const response = await apiClient.get<ApiResponse<BookIssue[]>>(
                '/api/v1/library/issues/overdue'
            );
            return response.data.data;
        },

        async getBorrowers(params: { type: string; limit?: number }): Promise<PaginatedResponse<{ id: string; name: string }>> {
            const query = buildQueryParams(params as any);
            const response = await apiClient.get<PaginatedResponse<{ id: string; name: string }>>(
                `/api/v1/library/borrowers${query}`
            );
            return response.data;
        },
    },
};
