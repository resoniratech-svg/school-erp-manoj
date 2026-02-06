/**
 * Fee Assignments Types
 */
import type { FeeAssignmentResponse } from '../fees.types';

export interface BulkAssignResult {
    assigned: number;
    skipped: number;
}

export interface FeeAssignmentListResponse {
    assignments: FeeAssignmentResponse[];
    total: number;
}
