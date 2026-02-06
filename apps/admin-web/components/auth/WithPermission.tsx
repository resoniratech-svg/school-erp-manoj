'use client';

/**
 * WithPermission Component
 * Render children only if user has permission
 */

import { type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

interface WithPermissionProps {
    /** Required permission */
    permission: string;
    /** Content to render if permitted */
    children: ReactNode;
    /** Fallback if not permitted (defaults to null) */
    fallback?: ReactNode;
}

export function WithPermission({
    permission,
    children,
    fallback = null,
}: WithPermissionProps) {
    const { hasPermission, isLoading } = useAuth();

    // Don't render during loading
    if (isLoading) return null;

    // Check permission
    if (!hasPermission(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * WithAnyPermission Component
 * Render children if user has any of the permissions
 */
interface WithAnyPermissionProps {
    permissions: string[];
    children: ReactNode;
    fallback?: ReactNode;
}

export function WithAnyPermission({
    permissions,
    children,
    fallback = null,
}: WithAnyPermissionProps) {
    const { hasAnyPermission, isLoading } = useAuth();

    if (isLoading) return null;

    if (!hasAnyPermission(permissions)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
