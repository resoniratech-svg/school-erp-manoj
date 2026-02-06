import { Router, Request, Response } from 'express';
import { env } from '../config';

const router = Router();

const startTime = Date.now();

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  uptime: number;
  uptimeHuman: string;
  timestamp: string;
  environment: string;
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

router.get('/', (_req: Request, res: Response) => {
  const uptime = Date.now() - startTime;

  const response: HealthResponse = {
    status: 'healthy',
    service: env.SERVICE_NAME,
    version: env.API_VERSION,
    uptime,
    uptimeHuman: formatUptime(uptime),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  };

  res.status(200).json(response);
});

router.get('/ready', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'live',
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRoutes };
