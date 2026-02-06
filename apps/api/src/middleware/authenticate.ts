import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@school-erp/shared';
import { authService } from '../../modules/auth/auth.service';
import { AUTH_ERROR_CODES } from '../../modules/auth/auth.constants';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Authorization header is required', { code: AUTH_ERROR_CODES.INVALID_TOKEN });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Invalid authorization format', { code: AUTH_ERROR_CODES.INVALID_TOKEN });
    }

    const payload = authService.verifyAccessToken(token);

    req.user = payload;
    req.userId = payload.sub;
    req.tenantId = payload.tenantId;

    next();
  } catch (error) {
    next(error);
  }
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      next();
      return;
    }

    try {
      const payload = authService.verifyAccessToken(token);
      req.user = payload;
      req.userId = payload.sub;
      req.tenantId = payload.tenantId;
    } catch {
    }

    next();
  } catch (error) {
    next(error);
  }
}
