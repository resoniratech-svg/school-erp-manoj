/**
 * Rate Limit Redis Helpers
 * Atomic counter operations with graceful degradation
 */
import { getRedis } from '../../utils/redis';
import { TTL_BUFFER_SECONDS } from './rate-limit.constants';
import { getLogger } from '../../utils/logger';

const logger = getLogger('rate-limit-redis');

/**
 * Increment counter and get current count
 * Returns { count, ttl } or null on Redis failure
 */
export async function incrementCounter(
    key: string,
    windowSeconds: number
): Promise<{ count: number; ttl: number } | null> {
    try {
        const redis = getRedis();
        if (!redis) {
            logger.warn('Redis client unavailable, rate limiting disabled');
            return null;
        }

        // Atomic increment
        const count = await redis.incr(key);

        // Set expiry on first increment
        if (count === 1) {
            await redis.expire(key, windowSeconds + TTL_BUFFER_SECONDS);
        }

        // Get remaining TTL
        const ttl = await redis.ttl(key);

        return { count, ttl: ttl > 0 ? ttl : windowSeconds };
    } catch (error) {
        logger.error('Redis error during rate limit check', { error, key });
        return null; // Fail open
    }
}

/**
 * Get current count for a key
 */
export async function getCounter(key: string): Promise<number | null> {
    try {
        const redis = getRedis();
        if (!redis) {
            return null;
        }

        const count = await redis.get(key);
        return count ? parseInt(count, 10) : 0;
    } catch (error) {
        logger.error('Redis error getting counter', { error, key });
        return null;
    }
}

/**
 * Check Redis connectivity
 */
export async function isRedisConnected(): Promise<boolean> {
    try {
        const redis = getRedis();
        if (!redis) {
            return false;
        }

        await redis.ping();
        return true;
    } catch {
        return false;
    }
}

/**
 * Reset counter (for testing only)
 */
export async function resetCounter(key: string): Promise<void> {
    try {
        const redis = getRedis();
        if (redis) {
            await redis.del(key);
        }
    } catch (error) {
        logger.error('Redis error resetting counter', { error, key });
    }
}
