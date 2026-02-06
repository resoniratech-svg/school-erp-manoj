/**
 * Auth Interceptor
 * Token management and refresh logic
 */
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ERROR_CODES } from '../types/api-error';

// In-memory token storage (SSR-safe)
let accessToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Set access token
 */
export function setAccessToken(token: string | null): void {
    accessToken = token;
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
    return accessToken;
}

/**
 * Clear access token
 */
export function clearAccessToken(): void {
    accessToken = null;
}

/**
 * Setup auth interceptors on Axios instance
 */
export function setupAuthInterceptor(axiosInstance: AxiosInstance): void {
    // Request interceptor - attach token
    axiosInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError<{ code?: string }>) => {
            const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

            // Check if 401 with TOKEN_EXPIRED
            if (
                error.response?.status === 401 &&
                error.response?.data?.code === 'AUTH_TOKEN_EXPIRED' &&
                !originalRequest._retry
            ) {
                originalRequest._retry = true;

                try {
                    // Attempt refresh
                    const newToken = await refreshAccessToken(axiosInstance);

                    if (newToken) {
                        // Update token and retry
                        setAccessToken(newToken);
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return axiosInstance(originalRequest);
                    }
                } catch {
                    // Refresh failed - clear token and propagate
                    clearAccessToken();
                    const authError = {
                        code: ERROR_CODES.AUTH_SESSION_EXPIRED,
                        message: 'Session expired. Please login again.',
                        statusCode: 401,
                    };
                    return Promise.reject(authError);
                }
            }

            return Promise.reject(error);
        }
    );
}

/**
 * Refresh access token
 */
async function refreshAccessToken(axiosInstance: AxiosInstance): Promise<string | null> {
    // Deduplicate refresh calls
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    isRefreshing = true;

    refreshPromise = axiosInstance
        .post<{ data: { accessToken: string } }>('/api/v1/auth/refresh')
        .then((response) => {
            return response.data.data.accessToken;
        })
        .catch(() => {
            return null;
        })
        .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
        });

    return refreshPromise;
}
