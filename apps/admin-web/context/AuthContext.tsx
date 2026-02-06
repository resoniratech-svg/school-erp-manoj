'use client';

/**
 * Auth Context
 * Provides user, roles, permissions across the app
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { type User } from '@school-erp/api-client';
import { getCurrentUser, login as authLogin, logout as authLogout } from '@/lib/auth';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Load user on mount
    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = useCallback(async (email: string, password: string) => {
        const response = await authLogin(email, password);
        setUser(response.user as User);
        router.push('/');
    }, [router]);

    const logout = useCallback(async () => {
        await authLogout();
        setUser(null);
        router.push('/login');
    }, [router]);

    const refreshUser = useCallback(async () => {
        await loadUser();
    }, []);

    const checkPermission = useCallback(
        (permission: string) => hasPermission(user, permission),
        [user]
    );

    const checkAnyPermission = useCallback(
        (permissions: string[]) => hasAnyPermission(user, permissions),
        [user]
    );

    const value: AuthContextValue = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission: checkPermission,
        hasAnyPermission: checkAnyPermission,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
