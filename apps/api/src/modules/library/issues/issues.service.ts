/**
 * Issues Sub-module Service
 * CRITICAL: Append-only - no delete
 */
import { libraryService } from '../library.service';
import type { IssueResponse, LibraryContext } from '../library.types';
import type { CreateIssueInput, ReturnBookInput } from '../library.validator';

export class IssuesService {
    async create(input: CreateIssueInput, context: LibraryContext): Promise<IssueResponse> {
        return libraryService.createIssue(input, context);
    }

    async getById(id: string, context: LibraryContext): Promise<IssueResponse> {
        return libraryService.getIssueById(id, context);
    }

    async list(
        filters: { bookId?: string; borrowerId?: string; borrowerType?: string; status?: string; overdue?: string },
        context: LibraryContext
    ): Promise<IssueResponse[]> {
        return libraryService.listIssues(filters, context);
    }

    async returnBook(id: string, input: ReturnBookInput, context: LibraryContext): Promise<IssueResponse> {
        return libraryService.returnBook(id, input, context);
    }

    // NO DELETE METHOD - Issues are append-only
}

export const issuesService = new IssuesService();
