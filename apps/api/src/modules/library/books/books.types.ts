/**
 * Books Sub-module Types
 */
import type { BookResponse } from '../library.types';

export interface BookListResponse {
    books: BookResponse[];
    total: number;
}
