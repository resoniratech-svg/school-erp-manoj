/**
 * Grades Types
 */
import type { GradeSlab } from './grades.constants';

export interface GradeConfig {
    tenantId: string;
    slabs: GradeSlab[];
}

export interface GradeResult {
    grade: string;
    percentage: number;
    isPassing: boolean;
}
