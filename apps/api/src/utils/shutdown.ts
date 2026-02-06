import { Server } from 'http';
import { getLogger } from './logger';

type ShutdownHandler = () => Promise<void> | void;

const shutdownHandlers: ShutdownHandler[] = [];
let isShuttingDown = false;

export function registerShutdownHandler(handler: ShutdownHandler): void {
  shutdownHandlers.push(handler);
}

export async function gracefulShutdown(server: Server, signal: string): Promise<void> {
  const logger = getLogger();

  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal', { signal });
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 30000);

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    logger.info('HTTP server closed');

    for (const handler of shutdownHandlers) {
      try {
        await handler();
      } catch (error) {
        logger.error('Error executing shutdown handler', { error: String(error) });
      }
    }

    clearTimeout(shutdownTimeout);
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    clearTimeout(shutdownTimeout);
    logger.error('Error during graceful shutdown', { error: String(error) });
    process.exit(1);
  }
}

export function setupShutdownHandlers(server: Server): void {
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

  for (const signal of signals) {
    process.on(signal, () => gracefulShutdown(server, signal));
  }

  process.on('uncaughtException', (error) => {
    const logger = getLogger();
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    gracefulShutdown(server, 'uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    const logger = getLogger();
    logger.error('Unhandled rejection', { reason: String(reason) });
  });
}
