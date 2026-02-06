/**
 * Subscription Enforcement Utilities
 */
import {
    ALLOWED_WHEN_INACTIVE_PATHS,
    WRITE_METHODS,
    INACTIVE_STATUSES,
    PATH_TO_FEATURE_MAP,
    PATH_TO_LIMIT_MAP,
} from './subscription.constants';
import type { SubscriptionStatus } from './subscription.types';

/**
 * Check if path is allowed when subscription is inactive
 */
export function isPathAllowedWhenInactive(path: string): boolean {
    return ALLOWED_WHEN_INACTIVE_PATHS.some((allowedPath) =>
        path.startsWith(allowedPath)
    );
}

/**
 * Check if HTTP method is a write operation
 */
export function isWriteMethod(method: string): boolean {
    return WRITE_METHODS.includes(method as typeof WRITE_METHODS[number]);
}

/**
 * Check if subscription status is inactive
 */
export function isInactiveStatus(status: SubscriptionStatus): boolean {
    return INACTIVE_STATUSES.includes(status as typeof INACTIVE_STATUSES[number]);
}

/**
 * Get feature key from request path
 */
export function getFeatureKeyFromPath(path: string): string | null {
    for (const [pathPrefix, featureKey] of Object.entries(PATH_TO_FEATURE_MAP)) {
        if (path.startsWith(pathPrefix)) {
            return featureKey;
        }
    }
    return null;
}

/**
 * Get limit key from request path
 */
export function getLimitKeyFromPath(path: string): string | null {
    for (const [pathPrefix, limitKey] of Object.entries(PATH_TO_LIMIT_MAP)) {
        if (path.startsWith(pathPrefix)) {
            return limitKey;
        }
    }
    return null;
}
