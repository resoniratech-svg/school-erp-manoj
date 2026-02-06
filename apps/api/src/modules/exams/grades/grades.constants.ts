/**
 * Grades Constants
 */

export const DEFAULT_GRADE_SLABS = [
    { grade: 'A+', minPercentage: 90, maxPercentage: 100 },
    { grade: 'A', minPercentage: 80, maxPercentage: 89.99 },
    { grade: 'B+', minPercentage: 70, maxPercentage: 79.99 },
    { grade: 'B', minPercentage: 60, maxPercentage: 69.99 },
    { grade: 'C', minPercentage: 50, maxPercentage: 59.99 },
    { grade: 'D', minPercentage: 40, maxPercentage: 49.99 },
    { grade: 'F', minPercentage: 0, maxPercentage: 39.99 },
] as const;

export type GradeSlab = {
    grade: string;
    minPercentage: number;
    maxPercentage: number;
};
