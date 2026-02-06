'use client';

/**
 * Fee Assignments List Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Users, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { DataTable, type Column, type RowAction } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { feesClient, type FeeAssignment } from '@school-erp/api-client';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    pending: 'default',
    partial: 'warning',
    paid: 'success',
    overdue: 'error',
};

export default function FeeAssignmentsPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<string>('');

    const { data, isLoading, isError, refetch } = useQuery(
        () => feesClient.assignments.list({ page, limit: 20, status: status || undefined })
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const columns: Column<FeeAssignment>[] = [
        {
            key: 'student',
            header: 'Student',
            accessor: (row) => row.student?.name ?? '—',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{String(value)}</span>
                </div>
            ),
        },
        {
            key: 'feeStructure',
            header: 'Fee Type',
            accessor: (row) => row.feeStructure?.name ?? '—',
        },
        {
            key: 'totalAmount',
            header: 'Total',
            accessor: 'totalAmount',
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
            header: 'Balance',
            accessor: (row) => row.totalAmount - row.paidAmount,
            align: 'right',
            render: (value) => (
                <span className={Number(value) > 0 ? 'font-medium text-red-600' : 'text-gray-500'}>
                    {formatCurrency(Number(value))}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            render: (value) => (
                <Badge variant={STATUS_VARIANTS[String(value)] ?? 'default'}>
                    {String(value)}
                </Badge>
            ),
        },
    ];

    const actions: RowAction<FeeAssignment>[] = [
        {
            label: 'View Details',
            icon: <Eye className="h-3 w-3" />,
            onClick: (row) => router.push(`/fees/assignments/${row.id}`),
        },
    ];

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        return <PageError onRetry={refetch} />;
    }

    const assignments = data?.data ?? [];
    const pagination = data?.pagination;

    return (
        <WithFeature flag="fees.enabled">
            <PageContent>
                <PageHeader
                    title="Fee Assignments"
                    subtitle="View and manage fee assignments to students"
                    actions={
                        <WithPermission permission="fee_assign:create:branch">
                            <Button onClick={() => router.push('/fees/assignments/bulk')}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Bulk Assign
                            </Button>
                        </WithPermission>
                    }
                />

                {/* Filters */}
                <Card>
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                    </div>
                </Card>

                <Card>
                    <DataTable
                        columns={columns}
                        data={assignments}
                        keyAccessor="id"
                        actions={actions}
                        emptyState={{
                            title: 'No fee assignments',
                            description: 'Use bulk assign to assign fees to students',
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
