'use client';

/**
 * RequirePermission Component
 * Hides children if user lacks permission
 */

import { type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

interface RequirePermissionProps {
    permission: string;
    children: ReactNode;
    fallback?: ReactNode;
}

export function RequirePermission({
    permission,
    children,
    fallback = null,
}: RequirePermissionProps) {
    const { hasPermission, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    if (!hasPermission(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * RequireAnyPermission Component
 * Shows children if user has any of the permissions
 */
interface RequireAnyPermissionProps {
    permissions: string[];
    children: ReactNode;
    fallback?: ReactNode;
}

export function RequireAnyPermission({
    permissions,
    children,
    fallback = null,
}: RequireAnyPermissionProps) {
    const { hasAnyPermission, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    if (!hasAnyPermission(permissions)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
