/**
 * Report Cards Types
 */
import type { ReportCardData } from '../reports.types';

export interface ReportCardListResponse {
    reportCards: ReportCardData[];
    total: number;
}

export interface BulkGenerateResult {
    generated: number;
    failed: number;
    errors: Array<{
        studentId: string;
        error: string;
    }>;
}
