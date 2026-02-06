import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sessionIdParamSchema,
} from './auth.validator';

const router = Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts. Please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many password reset requests. Please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);

router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.me);

router.get('/sessions', authenticate, authController.getSessions);

router.delete('/sessions/:sessionId', authenticate, validate(sessionIdParamSchema), authController.revokeSession);

router.post('/password/change', authenticate, validate(changePasswordSchema), authController.changePassword);

router.post('/password/forgot', passwordResetRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

router.post('/password/reset', validate(resetPasswordSchema), authController.resetPassword);

export { router as authRoutes };
