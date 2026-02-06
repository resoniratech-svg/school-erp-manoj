/**
 * Issues Sub-module Types
 */
import type { IssueResponse } from '../library.types';

export interface IssueListResponse {
    issues: IssueResponse[];
    total: number;
}
