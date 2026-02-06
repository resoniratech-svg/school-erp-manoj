import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../utils/logger';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const logger = getLogger();
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket.remoteAddress,
    };

    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
}
