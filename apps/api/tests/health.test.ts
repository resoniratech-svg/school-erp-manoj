import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { Application } from 'express';

describe('Health Routes', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(() => {
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('uptimeHuman');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });

    it('should return X-Request-ID header', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.headers['x-request-id']).toBeTruthy();
    });

    it('should accept custom X-Request-ID', async () => {
      const customRequestId = 'test-request-id-123';
      const response = await request(app)
        .get('/api/v1/health')
        .set('X-Request-ID', customRequestId);

      expect(response.headers['x-request-id']).toBe(customRequestId);
    });
  });

  describe('GET /api/v1/health/ready', () => {
    it('should return ready status', async () => {
      const response = await request(app).get('/api/v1/health/ready');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/v1/health/live', () => {
    it('should return live status', async () => {
      const response = await request(app).get('/api/v1/health/live');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'live');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/unknown');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('statusCode', 404);
    });
  });
});
