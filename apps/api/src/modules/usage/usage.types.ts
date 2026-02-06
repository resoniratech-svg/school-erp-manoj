/**
 * Usage Metering Types
 */

export interface UsageEventInput {
    tenantId: string;
    metric: string;
    delta: number;
    source: string;
    entityId?: string;
}

export interface UsageSummary {
    students: number;
    staff: number;
    branches: number;
    storage_mb: number;
    notifications: number;
}

export interface UsageWithLimit {
    metric: string;
    used: number;
    limit: number;
    percentage: number;
    isAtLimit: boolean;
}

export interface UsageSummaryResponse {
    usage: UsageSummary;
    limits: UsageSummary;
    items: UsageWithLimit[];
}

export interface UsageContext {
    tenantId: string;
    userId?: string;
}
