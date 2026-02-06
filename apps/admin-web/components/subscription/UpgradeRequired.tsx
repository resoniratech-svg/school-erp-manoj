'use client';

import Link from 'next/link';
import { Lock, ArrowUpRight } from 'lucide-react';

interface UpgradeRequiredProps {
    feature: string;
    requiredPlan?: string;
    reason?: string;
    className?: string;
}

export function UpgradeRequired({
    feature,
    requiredPlan = 'BASIC',
    reason,
    className = '',
}: UpgradeRequiredProps) {
    return (
        <div className={`flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center ${className}`}>
            <div className="rounded-full bg-gray-200 p-4">
                <Lock className="h-8 w-8 text-gray-500" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
                {feature} Unavailable
            </h2>
            <p className="mt-2 max-w-md text-gray-600">
                {reason || `Your current plan does not include ${feature}.`}
            </p>
            <p className="mt-1 text-sm text-gray-500">
                Upgrade to <span className="font-semibold">{requiredPlan}</span> or higher to unlock this feature.
            </p>
            <Link
                href="/settings/subscription"
                className="mt-6 flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700"
            >
                <ArrowUpRight className="h-5 w-5" />
                Upgrade Plan
            </Link>
        </div>
    );
}
