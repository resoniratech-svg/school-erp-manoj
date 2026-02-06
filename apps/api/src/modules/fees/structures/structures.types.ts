/**
 * Fee Structures Types
 */
import type { FeeStructureResponse } from '../fees.types';

export interface FeeStructureListResponse {
    structures: FeeStructureResponse[];
    total: number;
}
