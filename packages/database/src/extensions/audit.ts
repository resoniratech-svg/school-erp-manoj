import { Prisma } from '@prisma/client';
import { db } from '../client';

export interface AuditContext {
  tenantId?: string;
  branchId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
}

let currentAuditContext: AuditContext = {};

export function setAuditContext(context: AuditContext): void {
  currentAuditContext = context;
}

export function clearAuditContext(): void {
  currentAuditContext = {};
}

export function getAuditContext(): AuditContext {
  return currentAuditContext;
}

export async function createAuditLog(params: {
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'other';
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  responseStatus?: number;
  durationMs?: number;
}): Promise<void> {
  const context = getAuditContext();
  
  try {
    await db.auditLog.create({
      data: {
        tenantId: context.tenantId,
        branchId: context.branchId,
        userId: context.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        changes: params.changes as Prisma.InputJsonValue,
        requestPath: context.requestPath,
        requestMethod: context.requestMethod,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        responseStatus: params.responseStatus,
        durationMs: params.durationMs,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export function computeChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> | null {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  
  const sensitiveFields = ['passwordHash', 'password', 'token', 'secret'];
  
  for (const key of Object.keys(newData)) {
    if (sensitiveFields.includes(key)) {
      continue;
    }
    
    const oldValue = oldData[key];
    const newValue = newData[key];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = { old: oldValue, new: newValue };
    }
  }
  
  return Object.keys(changes).length > 0 ? changes : null;
}
