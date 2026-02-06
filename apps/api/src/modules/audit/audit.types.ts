/**
 * Audit Module Types
 */

// Audit Log Response (with masked sensitive data)
export interface AuditLogResponse {
    id: string;
    module: string;
    entity: string;
    entityId: string | null;
    action: string;
    userId: string;
    userName: string;
    userEmail: string;
    ipAddress: string | null;
    userAgent: string | null;
    changes: Record<string, unknown> | null; // Masked
    metadata: Record<string, unknown> | null; // Masked
    tenantId: string;
    branchId: string | null;
    createdAt: Date;
}

// Paginated Response
export interface AuditLogListResponse {
    logs: AuditLogResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Context
export interface AuditContext {
    tenantId: string;
    branchId?: string;
    userId: string;
}

// Filter Input
export interface AuditFilterInput {
    module?: string;
    entity?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
