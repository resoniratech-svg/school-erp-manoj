/**
 * Periods Types
 */

export interface PeriodResponse {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    displayOrder: number;
    periodType: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePeriodInput {
    name: string;
    startTime: string;
    endTime: string;
    displayOrder: number;
    periodType?: string;
}

export interface UpdatePeriodInput {
    name?: string;
    startTime?: string;
    endTime?: string;
    displayOrder?: number;
    periodType?: string;
}

export interface PeriodContext {
    tenantId: string;
    branchId: string;
    userId: string;
}
