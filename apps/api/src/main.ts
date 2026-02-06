import { env } from './config';
import { initLogger, getLogger } from './utils/logger';
import { registerShutdownHandler } from './utils/shutdown';
import { createApp } from './app';
import { startServer } from './server';
import { db } from '@school-erp/database';

async function main(): Promise<void> {
  initLogger(env.SERVICE_NAME, env.LOG_LEVEL);
  const logger = getLogger();

  logger.info('Starting application...', {
    service: env.SERVICE_NAME,
    version: env.API_VERSION,
    environment: env.NODE_ENV,
  });

  try {
    await db.$connect();
    logger.info('Database connected successfully');

    registerShutdownHandler(async () => {
      logger.info('Disconnecting from database...');
      await db.$disconnect();
      logger.info('Database disconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to database', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  const app = createApp();
  startServer(app);
}

main().catch((error) => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});
