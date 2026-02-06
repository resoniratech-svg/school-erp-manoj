export { db } from './client';
export { softDeleteExtension, type SoftDeleteMethods } from './extensions/soft-delete';
export {
  setAuditContext,
  clearAuditContext,
  getAuditContext,
  createAuditLog,
  computeChanges,
  type AuditContext,
} from './extensions/audit';

export type {
  PrismaClient,
  Prisma,
} from '@prisma/client';

export * from '@prisma/client';
