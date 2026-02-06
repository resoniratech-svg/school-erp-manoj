'use client';

/**
 * Collection Report Page
 */

import { useState } from 'react';
import { Download, DollarSign, CreditCard, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { feesClient } from '@school-erp/api-client';

export default function CollectionReportPage() {
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: '',
    });

    const { data: report, isLoading, isError, refetch } = useQuery(
        () => feesClient.reports.collection({
            startDate: dateRange.startDate || undefined,
            endDate: dateRange.endDate || undefined,
        })
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        return <PageError onRetry={refetch} />;
    }

    const summary = report?.summary ?? {
        totalCollected: 0,
        totalPending: 0,
        totalOverdue: 0,
    };

    const byMode = report?.byMode ?? [];

    return (
        <WithFeature flag="fees.enabled">
            <PageContent>
                <PageHeader
                    title="Collection Report"
                    subtitle="Fee collection summary and breakdown"
                    actions={
                        <Button variant="outline" onClick={() => alert('Export functionality')}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    }
                />

                {/* Filters */}
                <Card>
                    <div className="flex items-end gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) =>
                                    setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) =>
                                    setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                            />
                        </div>
                        <Button onClick={() => refetch()}>Apply</Button>
                    </div>
                </Card>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-green-50">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full bg-green-100 p-3">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-green-600">Total Collected</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {formatCurrency(summary.totalCollected)}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-yellow-50">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full bg-yellow-100 p-3">
                                <BarChart3 className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-yellow-600">Pending</p>
                                <p className="text-2xl font-bold text-yellow-700">
                                    {formatCurrency(summary.totalPending)}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-red-50">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full bg-red-100 p-3">
                                <BarChart3 className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-red-600">Overdue</p>
                                <p className="text-2xl font-bold text-red-700">
                                    {formatCurrency(summary.totalOverdue)}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Collection by Mode */}
                <Card title="Collection by Payment Mode">
                    {byMode.length > 0 ? (
                        <div className="space-y-4">
                            {byMode.map((item: { mode: string; amount: number; count: number }) => (
                                <div
                                    key={item.mode}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-5 w-5 text-gray-400" />
                                        <span className="font-medium capitalize">{item.mode}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">
                                            {formatCurrency(item.amount)}
                                        </p>
                                        <p className="text-sm text-gray-500">{item.count} payments</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No data available for the selected period</p>
                    )}
                </Card>
            </PageContent>
        </WithFeature>
    );
}
