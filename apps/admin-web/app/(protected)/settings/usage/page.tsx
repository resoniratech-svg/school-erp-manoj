'use client';

import Link from 'next/link';
import { ArrowUpRight, Users, UserCheck, Building2, HardDrive, Bell } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { useQuery } from '@/lib/hooks';
import { usageClient, type UsageWithLimit } from '@school-erp/api-client';

const METRIC_CONFIG: Record<string, { label: string; icon: React.ElementType; unit?: string }> = {
    students: { label: 'Students', icon: Users },
    staff: { label: 'Staff', icon: UserCheck },
    branches: { label: 'Branches', icon: Building2 },
    storage_mb: { label: 'Storage', icon: HardDrive, unit: 'MB' },
    notifications: { label: 'Notifications', icon: Bell, unit: '/month' },
};

function formatValue(value: number, unit?: string): string {
    if (unit === 'MB') {
        if (value >= 1024) {
            return `${(value / 1024).toFixed(1)} GB`;
        }
        return `${value} MB`;
    }
    return value.toLocaleString() + (unit || '');
}

function UsageBar({ item }: { item: UsageWithLimit }) {
    const config = METRIC_CONFIG[item.metric] || { label: item.metric, icon: Users };
    const Icon = config.icon;

    const barColor = item.percentage >= 90
        ? 'bg-red-500'
        : item.percentage >= 70
            ? 'bg-amber-500'
            : 'bg-primary-500';

    return (
        <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gray-100 p-2">
                        <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">{config.label}</h3>
                        <p className="text-sm text-gray-500">
                            {formatValue(item.used, config.unit)} / {formatValue(item.limit, config.unit)}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-lg font-bold ${item.isAtLimit ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.percentage}%
                    </span>
                    {item.isAtLimit && (
                        <p className="text-xs text-red-600">At limit</p>
                    )}
                </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                    className={`h-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
            </div>
        </div>
    );
}

export default function UsagePage() {
    const { data, isLoading, isError, refetch } = useQuery(() => usageClient.getSummary());

    if (isLoading) return <PageLoader />;
    if (isError || !data) return <PageError onRetry={refetch} />;

    const atLimitCount = data.items.filter((i) => i.isAtLimit).length;

    return (
        <WithPermission permission="subscription:read:tenant">
            <PageContent>
                <PageHeader title="Usage & Quotas" subtitle="Monitor your resource consumption" />

                {/* At Limit Warning */}
                {atLimitCount > 0 && (
                    <Card className="border-amber-200 bg-amber-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-amber-800">
                                    {atLimitCount} resource{atLimitCount > 1 ? 's' : ''} at limit
                                </p>
                                <p className="text-sm text-amber-700">
                                    Upgrade your plan to add more capacity.
                                </p>
                            </div>
                            <Link
                                href="/settings/subscription"
                                className="flex items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                            >
                                Upgrade <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </Card>
                )}

                {/* Usage Bars */}
                <div className="grid gap-4 md:grid-cols-2">
                    {data.items.map((item) => (
                        <UsageBar key={item.metric} item={item} />
                    ))}
                </div>

                {/* Upgrade CTA */}
                <Card className="text-center">
                    <h3 className="text-lg font-semibold">Need more capacity?</h3>
                    <p className="mt-1 text-gray-600">
                        Upgrade your plan to unlock higher limits and additional features.
                    </p>
                    <Link
                        href="/settings/subscription"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700"
                    >
                        View Plans <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Card>
            </PageContent>
        </WithPermission>
    );
}
