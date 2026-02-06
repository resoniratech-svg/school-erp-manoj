'use client';

/**
 * Defaulters Report Page
 */

import { useState } from 'react';
import { Download, AlertTriangle, User } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { feesClient } from '@school-erp/api-client';

interface Defaulter {
    id: string;
    studentId: string;
    studentName: string;
    className: string;
    sectionName: string;
    totalDue: number;
    paidAmount: number;
    balance: number;
    overdueDays: number;
}

export default function DefaultersReportPage() {
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(
        () => feesClient.reports.defaulters({ page, limit: 25 })
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const columns: Column<Defaulter>[] = [
        {
            key: 'student',
            header: 'Student',
            accessor: 'studentName',
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                        <p className="font-medium">{String(value)}</p>
                        <p className="text-sm text-gray-500">
                            {row.className} - {row.sectionName}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'totalDue',
            header: 'Total Due',
            accessor: 'totalDue',
            align: 'right',
            render: (value) => (
                <span className="font-medium">{formatCurrency(Number(value))}</span>
            ),
        },
        {
            key: 'paidAmount',
            header: 'Paid',
            accessor: 'paidAmount',
            align: 'right',
            render: (value) => (
                <span className="text-green-600">{formatCurrency(Number(value))}</span>
            ),
        },
        {
            key: 'balance',
            header: 'Outstanding',
            accessor: 'balance',
            align: 'right',
            render: (value) => (
                <span className="font-bold text-red-600">{formatCurrency(Number(value))}</span>
            ),
        },
        {
            key: 'overdueDays',
            header: 'Overdue',
            accessor: 'overdueDays',
            align: 'center',
            render: (value) => (
                <Badge variant={Number(value) > 30 ? 'error' : 'warning'}>
                    {Number(value)} days
                </Badge>
            ),
        },
    ];

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        return <PageError onRetry={refetch} />;
    }

    const defaulters = data?.data ?? [];
    const pagination = data?.pagination;
    const totalOutstanding = defaulters.reduce(
        (sum: number, d: Defaulter) => sum + d.balance,
        0
    );

    return (
        <WithFeature flag="fees.enabled">
            <PageContent>
                <PageHeader
                    title="Defaulters Report"
                    subtitle="Students with outstanding fee balances"
                    actions={
                        <Button variant="outline" onClick={() => alert('Export functionality')}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    }
                />

                {/* Summary */}
                <Card className="border-red-200 bg-red-50">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-red-100 p-3">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-red-600">Total Outstanding</p>
                            <p className="text-2xl font-bold text-red-700">
                                {formatCurrency(totalOutstanding)}
                            </p>
                            <p className="text-sm text-red-600">
                                {defaulters.length} students with pending dues
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Defaulters Table */}
                <Card>
                    <DataTable
                        columns={columns}
                        data={defaulters}
                        keyAccessor="id"
                        emptyState={{
                            title: 'No defaulters',
                            description: 'All fees are up to date!',
                        }}
                        pagination={
                            pagination
                                ? {
                                    currentPage: pagination.page,
                                    totalPages: pagination.totalPages,
                                    onPageChange: setPage,
                                }
                                : undefined
                        }
                    />
                </Card>
            </PageContent>
        </WithFeature>
    );
}
