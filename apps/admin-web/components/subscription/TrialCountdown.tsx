'use client';

import Link from 'next/link';
import { Clock, ArrowUpRight } from 'lucide-react';
import { useSubscriptionOptional } from '@/context/SubscriptionContext';

interface TrialCountdownProps {
    className?: string;
}

export function TrialCountdown({ className = '' }: TrialCountdownProps) {
    const subscription = useSubscriptionOptional();

    if (!subscription || subscription.isLoading) return null;

    const { isTrialing, daysRemaining, trialEndsAt } = subscription;

    if (!isTrialing || daysRemaining === null) return null;

    const totalDays = 14;
    const progressPercent = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));
    const isUrgent = daysRemaining <= 3;
    const isWarning = daysRemaining <= 7;

    return (
        <div className={`rounded-lg border bg-white p-4 shadow-sm ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${isUrgent ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-blue-100'}`}>
                        <Clock className={`h-5 w-5 ${isUrgent ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Trial Period</h3>
                        <p className="text-sm text-gray-500">
                            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                            {trialEndsAt && ` (ends ${trialEndsAt.toLocaleDateString()})`}
                        </p>
                    </div>
                </div>
                <Link
                    href="/settings/subscription"
                    className="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                    Upgrade <ArrowUpRight className="h-4 w-4" />
                </Link>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                        className={`h-full transition-all duration-300 ${isUrgent ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>Day 1</span>
                    <span>Day {totalDays}</span>
                </div>
            </div>

            {isUrgent && (
                <p className="mt-3 text-sm text-red-600">
                    ⚠️ Trial ends soon! Upgrade now to avoid losing access.
                </p>
            )}
        </div>
    );
}
