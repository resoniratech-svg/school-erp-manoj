/**
 * Axios Instance
 * Configured HTTP client for School ERP API
 */
import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { generateRequestId, REQUEST_ID_HEADER } from './request-id';
import { setupAuthInterceptor } from './auth.interceptor';
import { normalizeError } from './error.handler';
import { shouldRetry, getRetryDelay, incrementRetryCount, sleep } from './retry';

// Base URL from environment
const BASE_URL = typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    : 'http://localhost:3001';

/**
 * Create configured Axios instance
 */
function createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
        baseURL: BASE_URL,
        timeout: 30000, // 30 seconds
        withCredentials: true, // For refresh token cookie
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor - add request ID
    instance.interceptors.request.use(
        (config) => {
            config.headers[REQUEST_ID_HEADER] = generateRequestId();
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Setup auth interceptor
    setupAuthInterceptor(instance);

    // Response interceptor - error normalization and retry
    instance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const config = error.config;

            // Check if should retry
            if (config && shouldRetry(error, config)) {
                const newConfig = incrementRetryCount(config);
                const delay = getRetryDelay(newConfig._retryCount || 0);

                await sleep(delay);
                return instance(newConfig);
            }

            // Normalize and throw
            throw normalizeError(error);
        }
    );

    return instance;
}

/**
 * Singleton Axios instance
 */
export const apiClient = createAxiosInstance();

/**
 * Re-export for testing/custom instances
 */
export { createAxiosInstance };
