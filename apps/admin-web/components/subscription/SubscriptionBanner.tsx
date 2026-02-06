'use client';

import Link from 'next/link';
import { Clock, AlertTriangle, XCircle, ArrowUpRight } from 'lucide-react';
import { useSubscriptionOptional } from '@/context/SubscriptionContext';

export function SubscriptionBanner() {
    const subscription = useSubscriptionOptional();

    if (!subscription || subscription.isLoading) return null;

    const { status, isTrialing, isPastDue, isSuspended, daysRemaining } = subscription;

    // Trial warning (≤ 7 days remaining)
    if (isTrialing && daysRemaining !== null && daysRemaining <= 7) {
        return (
            <div className="bg-amber-500 px-4 py-2 text-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            ⏳ Trial ends in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}. Upgrade to avoid interruption.
                        </span>
                    </div>
                    <Link
                        href="/settings/subscription"
                        className="flex items-center gap-1 rounded bg-white/20 px-3 py-1 text-sm font-medium hover:bg-white/30"
                    >
                        Upgrade <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        );
    }

    // Past due
    if (isPastDue) {
        return (
            <div className="bg-red-600 px-4 py-2 text-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            ⚠️ Subscription expired. Upgrade to regain full access.
                        </span>
                    </div>
                    <Link
                        href="/settings/subscription"
                        className="flex items-center gap-1 rounded bg-white/20 px-3 py-1 text-sm font-medium hover:bg-white/30"
                    >
                        Upgrade Now <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        );
    }

    // Suspended
    if (isSuspended) {
        return (
            <div className="bg-gray-800 px-4 py-2 text-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            🚫 Account suspended. Contact support or upgrade to restore access.
                        </span>
                    </div>
                    <Link
                        href="/settings/subscription"
                        className="flex items-center gap-1 rounded bg-white/20 px-3 py-1 text-sm font-medium hover:bg-white/30"
                    >
                        Upgrade <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        );
    }

    return null;
}
