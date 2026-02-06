import type { JwtPayload } from '../modules/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      tenantId?: string;
      branchId?: string;
      userId?: string;
      sessionId?: string;
      user?: JwtPayload;
    }
  }
}

export {};
