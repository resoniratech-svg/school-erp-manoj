/**
 * Audit Module Mapper
 * CRITICAL: Masks sensitive data before exposure
 */
import type { AuditLogResponse } from './audit.types';
import { SENSITIVE_FIELDS, MASK_PATTERN } from './audit.constants';

type AuditLogWithUser = {
    id: string;
    module: string;
    entity: string;
    entityId: string | null;
    action: string;
    userId: string;
    ipAddress: string | null;
    userAgent: string | null;
    changes: unknown;
    metadata: unknown;
    tenantId: string;
    branchId: string | null;
    createdAt: Date;
    user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    } | null;
};

/**
 * Recursively mask sensitive fields in an object
 */
function maskSensitiveData(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(maskSensitiveData);
    }

    if (typeof obj === 'object') {
        const masked: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            const lowerKey = key.toLowerCase();
            const isSensitive = SENSITIVE_FIELDS.some(field =>
                lowerKey.includes(field.toLowerCase())
            );

            if (isSensitive) {
                masked[key] = MASK_PATTERN;
            } else if (typeof value === 'object') {
                masked[key] = maskSensitiveData(value);
            } else {
                masked[key] = value;
            }
        }
        return masked;
    }

    return obj;
}

/**
 * Map audit log to response with masked sensitive data
 */
export function mapAuditLogToResponse(log: AuditLogWithUser): AuditLogResponse {
    return {
        id: log.id,
        module: log.module,
        entity: log.entity,
        entityId: log.entityId,
        action: log.action,
        userId: log.userId,
        userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : '',
        userEmail: log.user?.email || '',
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        changes: maskSensitiveData(log.changes) as Record<string, unknown> | null,
        metadata: maskSensitiveData(log.metadata) as Record<string, unknown> | null,
        tenantId: log.tenantId,
        branchId: log.branchId,
        createdAt: log.createdAt,
    };
}
