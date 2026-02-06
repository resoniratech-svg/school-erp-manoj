import { Request, Response, NextFunction } from 'express';
import { createApiResponse, createEmptyResponse, AppError } from '@school-erp/shared';
import { authService, AuthService } from './auth.service';
import type {
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  SessionIdParam,
} from './auth.validator';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as LoginInput;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await this.service.login(body, ipAddress, userAgent);

      res.status(200).json(
        createApiResponse(result, {
          message: 'Login successful',
          meta: { requestId: req.requestId },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const tokens = await this.service.refreshToken(refreshToken, ipAddress, userAgent);

      res.status(200).json(
        createApiResponse({ tokens }, {
          message: 'Token refreshed successfully',
          meta: { requestId: req.requestId },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const sessionId = req.sessionId;

      if (!userId || !sessionId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.service.logout(sessionId, userId);

      res.status(200).json(
        createEmptyResponse('Logged out successfully', req.requestId)
      );
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;

      if (!userId || !tenantId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await this.service.getCurrentUser(userId, tenantId);

      res.status(200).json(
        createApiResponse(user, {
          meta: { requestId: req.requestId },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const currentSessionId = req.sessionId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const sessions = await this.service.getActiveSessions(userId, currentSessionId);

      res.status(200).json(
        createApiResponse(sessions, {
          meta: { requestId: req.requestId },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { sessionId } = req.params as SessionIdParam;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.service.revokeSession(sessionId, userId);

      res.status(200).json(
        createEmptyResponse('Session revoked successfully', req.requestId)
      );
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const sessionId = req.sessionId;
      const { currentPassword, newPassword } = req.body as ChangePasswordInput;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.service.changePassword(userId, currentPassword, newPassword, sessionId);

      res.status(200).json(
        createEmptyResponse('Password changed successfully', req.requestId)
      );
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body as ForgotPasswordInput;

      await this.service.forgotPassword(email);

      res.status(200).json(
        createEmptyResponse(
          'If an account exists with this email, you will receive password reset instructions',
          req.requestId
        )
      );
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body as ResetPasswordInput;

      await this.service.resetPassword(token, newPassword);

      res.status(200).json(
        createEmptyResponse('Password reset successfully', req.requestId)
      );
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
