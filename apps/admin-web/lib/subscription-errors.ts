'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

// Subscription error codes from backend
const SUBSCRIPTION_ERROR_CODES = {
    NO_SUBSCRIPTION: 'NO_SUBSCRIPTION',
    SUBSCRIPTION_INACTIVE: 'SUBSCRIPTION_INACTIVE',
    FEATURE_DISABLED: 'FEATURE_DISABLED',
    PLAN_LIMIT_EXCEEDED: 'PLAN_LIMIT_EXCEEDED',
} as const;

// User-friendly messages
const SUBSCRIPTION_ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
    [SUBSCRIPTION_ERROR_CODES.NO_SUBSCRIPTION]: {
        title: 'No Subscription',
        message: 'Please contact support to set up your subscription.',
    },
    [SUBSCRIPTION_ERROR_CODES.SUBSCRIPTION_INACTIVE]: {
        title: 'Subscription Expired',
        message: 'Your subscription has expired. Upgrade to continue using this feature.',
    },
    [SUBSCRIPTION_ERROR_CODES.FEATURE_DISABLED]: {
        title: 'Feature Unavailable',
        message: 'This feature is not available on your current plan. Upgrade to access it.',
    },
    [SUBSCRIPTION_ERROR_CODES.PLAN_LIMIT_EXCEEDED]: {
        title: 'Plan Limit Reached',
        message: 'You have reached the limit for your plan. Upgrade for more capacity.',
    },
};

/**
 * Check if error is a subscription-related error
 */
export function isSubscriptionError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const err = error as { code?: string; message?: string };
    const code = err.code || err.message || '';
    return Object.values(SUBSCRIPTION_ERROR_CODES).includes(code as typeof SUBSCRIPTION_ERROR_CODES[keyof typeof SUBSCRIPTION_ERROR_CODES]);
}

/**
 * Get user-friendly message for subscription error
 */
export function getSubscriptionErrorMessage(error: unknown): { title: string; message: string } {
    const err = error as { code?: string; message?: string };
    const code = err.code || err.message || '';
    return SUBSCRIPTION_ERROR_MESSAGES[code] || {
        title: 'Access Restricted',
        message: 'You do not have access to this feature.',
    };
}

/**
 * Hook to handle subscription errors with toast + upgrade prompt
 */
export function useSubscriptionErrorHandler() {
    const toast = useToast();
    const router = useRouter();

    return (error: unknown) => {
        if (!isSubscriptionError(error)) {
            return false; // Not a subscription error, let caller handle it
        }

        const { title, message } = getSubscriptionErrorMessage(error);

        // Show toast with upgrade action
        toast.error(`${title}: ${message}`, {
            duration: 5000,
            action: {
                label: 'Upgrade',
                onClick: () => router.push('/settings/subscription'),
            },
        });

        return true; // Error was handled
    };
}

/**
 * Wrapper component to catch subscription errors in children
 */
export function SubscriptionErrorBoundary({
    children,
    fallback,
}: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    // This is a simplified boundary - full implementation would use ErrorBoundary
    return <>{ children } </>;
}
