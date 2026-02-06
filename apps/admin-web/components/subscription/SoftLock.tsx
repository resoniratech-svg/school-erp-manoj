'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { Lock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useSubscriptionOptional } from '@/context/SubscriptionContext';
import { UpgradeRequired } from './UpgradeRequired';

type SoftLockMode = 'read' | 'write';

interface SoftLockProps {
    children: ReactNode;
    feature?: string;
    featureLabel?: string;
    mode?: SoftLockMode;
    limitExceeded?: boolean;
    limitLabel?: string;
    requiredPlan?: string;
    fallback?: ReactNode;
}

/**
 * SoftLock - Wraps content with subscription-aware locking
 * 
 * Behavior:
 * - Feature disabled → Show lock screen
 * - Limit exceeded (write mode) → Disable submit + message
 * - past_due → Read-only UI (write mode blocked)
 * - Trial expired → Block writes
 * 
 * Does NOT destroy unsaved data or redirect.
 */
export function SoftLock({
    children,
    feature,
    featureLabel,
    mode = 'read',
    limitExceeded = false,
    limitLabel,
    requiredPlan = 'BASIC',
    fallback,
}: SoftLockProps) {
    const subscription = useSubscriptionOptional();

    // If no subscription context, render children (graceful degradation)
    if (!subscription) {
        return <>{children}</>;
    }

    const { isPastDue, isSuspended, isLoading } = subscription;

    // Loading state - show children but could add skeleton
    if (isLoading) {
        return <>{children}</>;
    }

    // Suspended - show upgrade required
    if (isSuspended) {
        if (fallback) return <>{fallback}</>;
        return (
            <UpgradeRequired
                feature={featureLabel || feature || 'This feature'}
                requiredPlan={requiredPlan}
                reason="Your account is suspended. Contact support or upgrade to restore access."
            />
        );
    }

    // past_due in write mode - show read-only overlay
    if (isPastDue && mode === 'write') {
        return (
            <div className="relative">
                {/* Render children but disabled */}
                <div className="pointer-events-none opacity-50">
                    {children}
                </div>
                {/* Overlay message */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="rounded-lg bg-white p-6 text-center shadow-lg">
                        <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
                        <h3 className="mt-3 font-semibold text-gray-900">Subscription Expired</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Upgrade your plan to make changes.
                        </p>
                        <Link
                            href="/settings/subscription"
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                        >
                            Upgrade <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Limit exceeded in write mode - show warning
    if (limitExceeded && mode === 'write') {
        return (
            <div className="relative">
                {/* Render children but disabled */}
                <div className="pointer-events-none opacity-50">
                    {children}
                </div>
                {/* Overlay message */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="rounded-lg bg-white p-6 text-center shadow-lg">
                        <Lock className="mx-auto h-8 w-8 text-red-500" />
                        <h3 className="mt-3 font-semibold text-gray-900">Plan Limit Reached</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            {limitLabel || 'You have reached the maximum allowed by your plan.'}
                        </p>
                        <Link
                            href="/settings/subscription"
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                        >
                            Upgrade for More <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // All checks passed - render children
    return <>{children}</>;
}

/**
 * SoftLockOverlay - Inline upgrade prompt without blocking
 */
export function SoftLockOverlay({
    message,
    showUpgrade = true,
}: {
    message: string;
    showUpgrade?: boolean;
}) {
    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-amber-800">{message}</p>
                {showUpgrade && (
                    <Link
                        href="/settings/subscription"
                        className="ml-auto flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                        Upgrade <ArrowUpRight className="h-4 w-4" />
                    </Link>
                )}
            </div>
        </div>
    );
}
