import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express, { Application } from 'express';
import { authRoutes } from '../auth.routes';
import { requestIdMiddleware } from '../../../middleware/request-id';

vi.mock('../auth.service', () => ({
  authService: {
    login: vi.fn(),
    refreshToken: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    getActiveSessions: vi.fn(),
    revokeSession: vi.fn(),
    changePassword: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyAccessToken: vi.fn(),
  },
  AuthService: vi.fn(),
}));

import { authService } from '../auth.service';

const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());
  app.use(requestIdMiddleware);
  app.use('/auth', authRoutes);
  return app;
};

describe('Auth Routes', () => {
  let app: Application;

  beforeAll(() => {
    app = createTestApp();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should return 200 on successful login', async () => {
      const mockLoginResponse = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 900000,
        },
      };

      (authService.login as ReturnType<typeof vi.fn>).mockResolvedValue(mockLoginResponse);

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'invalid-email', password: 'password123' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 200 on successful token refresh', async () => {
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900000,
      };

      (authService.refreshToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockTokens);

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/password/forgot', () => {
    it('should return 200 for password reset request', async () => {
      (authService.forgotPassword as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/auth/password/forgot')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/auth/password/forgot')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/password/reset', () => {
    it('should return 200 on successful password reset', async () => {
      (authService.resetPassword as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/auth/password/reset')
        .send({
          token: 'valid-reset-token',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for password mismatch', async () => {
      const response = await request(app)
        .post('/auth/password/reset')
        .send({
          token: 'valid-reset-token',
          newPassword: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/auth/password/reset')
        .send({
          token: 'valid-reset-token',
          newPassword: 'weak',
          confirmPassword: 'weak',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Protected Routes', () => {
    it('GET /auth/me should return 401 without token', async () => {
      const response = await request(app).get('/auth/me');

      expect(response.status).toBe(401);
    });

    it('POST /auth/logout should return 401 without token', async () => {
      const response = await request(app).post('/auth/logout');

      expect(response.status).toBe(401);
    });

    it('GET /auth/sessions should return 401 without token', async () => {
      const response = await request(app).get('/auth/sessions');

      expect(response.status).toBe(401);
    });

    it('DELETE /auth/sessions/:sessionId should return 401 without token', async () => {
      const response = await request(app).delete('/auth/sessions/some-session-id');

      expect(response.status).toBe(401);
    });

    it('POST /auth/password/change should return 401 without token', async () => {
      const response = await request(app)
        .post('/auth/password/change')
        .send({
          currentPassword: 'CurrentPass123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(401);
    });
  });
});
