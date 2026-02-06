/**
 * Grades Service
 * Provides grade calculation based on percentage
 */
import { DEFAULT_GRADE_SLABS, type GradeSlab } from './grades.constants';

export class GradesService {
    private gradeSlabs: GradeSlab[] = [...DEFAULT_GRADE_SLABS];

    /**
     * Calculate grade based on percentage
     */
    calculateGrade(percentage: number): string {
        for (const slab of this.gradeSlabs) {
            if (percentage >= slab.minPercentage && percentage <= slab.maxPercentage) {
                return slab.grade;
            }
        }
        return 'F';
    }

    /**
     * Check if percentage is passing
     */
    isPassing(percentage: number, passingPercentage: number = 40): boolean {
        return percentage >= passingPercentage;
    }

    /**
     * Get grade info with full details
     */
    getGradeInfo(percentage: number): { grade: string; isPassing: boolean } {
        const grade = this.calculateGrade(percentage);
        const isPassing = this.isPassing(percentage);
        return { grade, isPassing };
    }

    /**
     * Get all grade slabs
     */
    getGradeSlabs(): GradeSlab[] {
        return [...this.gradeSlabs];
    }

    /**
     * Set custom grade slabs (tenant-specific in future)
     */
    setGradeSlabs(slabs: GradeSlab[]): void {
        this.gradeSlabs = slabs.sort((a, b) => b.minPercentage - a.minPercentage);
    }
}

export const gradesService = new GradesService();
