/**
 * Auth Client
 * Authentication and session management
 */
import { apiClient } from '../core/axios';
import { setAccessToken, clearAccessToken } from '../core/auth.interceptor';
import type { ApiResponse } from '../types/api-response';

// Types
export interface LoginCredentials {
    email: string;
    password: string;
    tenantSlug?: string;
}

export interface LoginResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
    };
    tenant: {
        id: string;
        name: string;
        slug: string;
    };
    branch?: {
        id: string;
        name: string;
    };
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
    tenantId: string;
    branchId?: string;
}

export interface Session {
    id: string;
    device: string;
    ipAddress: string;
    lastActive: Date;
    isCurrent: boolean;
}

/**
 * Auth Client
 */
export const authClient = {
    /**
     * Login with credentials
     */
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const response = await apiClient.post<ApiResponse<LoginResponse>>(
            '/api/v1/auth/login',
            credentials
        );
        const data = response.data.data;

        // Store access token in memory
        setAccessToken(data.accessToken);

        return data;
    },

    /**
     * Logout current session
     */
    async logout(): Promise<void> {
        try {
            await apiClient.post('/api/v1/auth/logout');
        } finally {
            clearAccessToken();
        }
    },

    /**
     * Get current user
     */
    async me(): Promise<User> {
        const response = await apiClient.get<ApiResponse<User>>('/api/v1/auth/me');
        return response.data.data;
    },

    /**
     * Refresh access token
     */
    async refresh(): Promise<string> {
        const response = await apiClient.post<ApiResponse<{ accessToken: string }>>(
            '/api/v1/auth/refresh'
        );
        const token = response.data.data.accessToken;
        setAccessToken(token);
        return token;
    },

    /**
     * Request password reset
     */
    async requestPasswordReset(email: string): Promise<void> {
        await apiClient.post('/api/v1/auth/password/reset', { email });
    },

    /**
     * Reset password with token
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        await apiClient.post('/api/v1/auth/password/reset/confirm', {
            token,
            newPassword,
        });
    },

    /**
     * Change password (authenticated)
     */
    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await apiClient.post('/api/v1/auth/password/change', {
            currentPassword,
            newPassword,
        });
    },

    /**
     * Sessions management
     */
    sessions: {
        /**
         * List active sessions
         */
        async list(): Promise<Session[]> {
            const response = await apiClient.get<ApiResponse<Session[]>>(
                '/api/v1/auth/sessions'
            );
            return response.data.data;
        },

        /**
         * Revoke a session
         */
        async revoke(sessionId: string): Promise<void> {
            await apiClient.delete(`/api/v1/auth/sessions/${sessionId}`);
        },

        /**
         * Revoke all other sessions
         */
        async revokeAll(): Promise<void> {
            await apiClient.delete('/api/v1/auth/sessions');
        },
    },
};
