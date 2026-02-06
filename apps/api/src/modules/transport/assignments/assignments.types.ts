/**
 * Assignments Sub-module Types
 */
import type { TransportAssignmentResponse } from '../transport.types';

export interface AssignmentListResponse {
    assignments: TransportAssignmentResponse[];
    total: number;
}
