'use client';

/**
 * Payments List Page (READ-ONLY)
 * CRITICAL: No edit/delete/create functionality
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, CreditCard, AlertCircle, Lock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { DataTable, type Column, type RowAction } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { feesClient, type Payment } from '@school-erp/api-client';

const MODE_LABELS: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    online: 'Online',
};

export default function PaymentsListPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(
        () => feesClient.payments.list({ page, limit: 20 })
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const columns: Column<Payment>[] = [
        {
            key: 'receiptNumber',
            header: 'Receipt #',
            accessor: 'receiptNumber',
            render: (value) => (
                <span className="font-mono font-medium text-primary-600">
                    {String(value)}
                </span>
            ),
        },
        {
            key: 'student',
            header: 'Student',
            accessor: (row) => row.student?.name ?? '—',
        },
        {
            key: 'amount',
            header: 'Amount',
            accessor: 'amount',
            align: 'right',
            render: (value) => (
                <span className="font-medium text-green-600">
                    {formatCurrency(Number(value))}
                </span>
            ),
        },
        {
            key: 'mode',
            header: 'Payment Mode',
            accessor: 'mode',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    {MODE_LABELS[String(value)] ?? String(value)}
                </div>
            ),
        },
        {
            key: 'createdAt',
            header: 'Date',
            accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
        },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            render: (value) => (
                <Badge variant={value === 'completed' ? 'success' : 'default'}>
                    {String(value)}
                </Badge>
            ),
        },
    ];

    // READ-ONLY: Only view action allowed
    const actions: RowAction<Payment>[] = [
        {
            label: 'View Receipt',
            icon: <Eye className="h-3 w-3" />,
            onClick: (row) => router.push(`/fees/payments/${row.id}`),
        },
    ];

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        return <PageError onRetry={refetch} />;
    }

    const payments = data?.data ?? [];
    const pagination = data?.pagination;

    return (
        <WithFeature flag="fees.enabled">
            <PageContent>
                <PageHeader
                    title="Payment Records"
                    subtitle="View-only payment history and receipts"
                />

                {/* Immutable Notice */}
                <Card className="border-blue-200 bg-blue-50">
                    <div className="flex items-start gap-3">
                        <Lock className="h-5 w-5 text-blue-600" />
                        <div>
                            <p className="font-medium text-blue-800">Read-Only Records</p>
                            <p className="mt-1 text-sm text-blue-700">
                                Payment records are immutable and cannot be modified once created.
                                This ensures financial integrity and audit compliance.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <DataTable
                        columns={columns}
                        data={payments}
                        keyAccessor="id"
                        actions={actions}
                        emptyState={{
                            title: 'No payments recorded',
                            description: 'Payments will appear here once students make fee payments',
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
