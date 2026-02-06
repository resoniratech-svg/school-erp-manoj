/**
 * Request ID Generator
 * Propagates X-Request-Id for tracing
 */

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `req-${timestamp}-${random}`;
}

/**
 * Request ID header name
 */
export const REQUEST_ID_HEADER = 'X-Request-Id';
