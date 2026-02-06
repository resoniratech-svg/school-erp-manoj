import { createServer, Server } from 'http';
import { Application } from 'express';
import { env } from './config';
import { getLogger } from './utils/logger';
import { setupShutdownHandlers } from './utils/shutdown';

export function startServer(app: Application): Server {
  const logger = getLogger();
  const server = createServer(app);

  server.listen(env.PORT, env.HOST, () => {
    logger.info(`🚀 Server started`, {
      host: env.HOST,
      port: env.PORT,
      environment: env.NODE_ENV,
      service: env.SERVICE_NAME,
      version: env.API_VERSION,
    });

    logger.info(`📍 Health check: http://${env.HOST}:${env.PORT}/api/v1/health`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${env.PORT} is already in use`);
      process.exit(1);
    }
    throw error;
  });

  setupShutdownHandlers(server);

  return server;
}
