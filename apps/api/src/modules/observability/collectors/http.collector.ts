/**
 * HTTP Metrics Collector
 * Middleware for request metrics
 */
import type { Request, Response, NextFunction } from 'express';
import { incCounter, observeHistogram } from '../observability.metrics';
import { METRIC_NAME } from '../observability.constants';

/**
 * HTTP metrics middleware
 */
export function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();

    // Capture original end
    const originalEnd = res.end.bind(res);

    res.end = function (...args: Parameters<typeof res.end>): ReturnType<typeof res.end> {
        const duration = Number(process.hrtime.bigint() - start) / 1e9; // Convert to seconds

        const labels = {
            method: req.method,
            path: normalizePath(req.path),
            statusCode: String(res.statusCode),
        };

        // Increment request counter
        incCounter(METRIC_NAME.HTTP_REQUEST_TOTAL, labels);

        // Observe latency
        observeHistogram(METRIC_NAME.HTTP_REQUEST_DURATION, duration, labels);

        // Track errors
        if (res.statusCode >= 400) {
            incCounter(METRIC_NAME.HTTP_ERROR_TOTAL, {
                method: req.method,
                path: normalizePath(req.path),
                statusCode: String(res.statusCode),
                errorType: res.statusCode >= 500 ? '5xx' : '4xx',
            });
        }

        return originalEnd(...args);
    };

    next();
}

/**
 * Normalize path to reduce cardinality
 * /users/123 → /users/:id
 */
function normalizePath(path: string): string {
    return path
        .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id') // UUID
        .replace(/\/\d+/g, '/:id') // Numeric IDs
        .replace(/\/[A-Za-z0-9]{20,}/g, '/:id'); // Long alphanumeric IDs
}
