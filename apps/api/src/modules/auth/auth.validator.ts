import { z } from 'zod';
import { AUTH_CONSTANTS } from './auth.constants';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').max(255),
    password: z.string().min(1, 'Password is required').max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH),
    rememberMe: z.boolean().optional().default(false),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z
        .string()
        .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`)
        .max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH, `Password must be at most ${AUTH_CONSTANTS.PASSWORD_MAX_LENGTH} characters`)
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
      confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').max(255),
  }),
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().min(1, 'Reset token is required'),
      newPassword: z
        .string()
        .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`)
        .max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH, `Password must be at most ${AUTH_CONSTANTS.PASSWORD_MAX_LENGTH} characters`)
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
      confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

export const sessionIdParamSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type SessionIdParam = z.infer<typeof sessionIdParamSchema>['params'];
