import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { AppError, createApiErrorResponse } from '@school-erp/shared';
import { env } from './config';
import { requestIdMiddleware, requestLoggerMiddleware } from './middleware';
import { apiRoutes } from './routes';
import { getLogger } from './utils/logger';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  
  const corsOrigins = env.CORS_ORIGINS === '*' ? '*' : env.CORS_ORIGINS.split(',');
  app.use(cors({ origin: corsOrigins }));
  
  app.use(compression());
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  app.use('/api/v1', apiRoutes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
        statusCode: 404,
      },
    });
  });

  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    const logger = getLogger();

    if (AppError.isAppError(err)) {
      if (!err.isOperational) {
        logger.error('Non-operational error', {
          error: err.message,
          stack: err.stack,
          requestId: req.requestId,
          path: req.path,
          method: req.method,
        });
      }

      const response = createApiErrorResponse(err.toJSON(), {
        meta: {
          requestId: req.requestId,
          path: req.path,
          method: req.method,
        },
      });

      res.status(err.statusCode).json(response);
      return;
    }

    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      requestId: req.requestId,
      path: req.path,
      method: req.method,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
        statusCode: 500,
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  return app;
}
