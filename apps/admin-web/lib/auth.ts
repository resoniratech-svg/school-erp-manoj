/**
 * Auth Utilities
 */

import { authClient, type User } from '@school-erp/api-client';

/**
 * Get current user (for initial load)
 */
export async function getCurrentUser(): Promise<User | null> {
    try {
        return await authClient.me();
    } catch {
        return null;
    }
}

/**
 * Login
 */
export async function login(email: string, password: string) {
    return authClient.login({ email, password });
}

/**
 * Logout
 */
export async function logout() {
    return authClient.logout();
}

/**
 * Check if user has role
 */
export function hasRole(user: User | null, role: string): boolean {
    if (!user) return false;
    return user.role === role;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User | null): boolean {
    return hasRole(user, 'admin') || hasRole(user, 'super_admin');
}
