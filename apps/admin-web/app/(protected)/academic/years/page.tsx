'use client';

/**
 * Academic Years List Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, Play, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { DataTable, type Column, type RowAction } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery, useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { academicClient, type AcademicYear } from '@school-erp/api-client';

export default function AcademicYearsPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(
        () => academicClient.years.list({ page, limit: 20 })
    );

    const deleteMutation = useMutation(
        (id: string) => academicClient.years.delete(id),
        {
            onSuccess: () => {
                toast.success('Academic year deleted successfully');
                refetch();
            },
            onError: (error) => {
                toast.error(error.message);
            },
        }
    );

    const activateMutation = useMutation(
        (id: string) => academicClient.years.activate(id),
        {
            onSuccess: () => {
                toast.success('Academic year activated successfully');
                refetch();
            },
            onError: (error) => {
                toast.error(error.message);
            },
        }
    );

    const handleDelete = async (year: AcademicYear) => {
        if (year.isCurrent) {
            toast.error('Cannot delete the current academic year');
            return;
        }

        const confirmed = await confirm({
            title: 'Delete Academic Year',
            message: `Are you sure you want to delete "${year.name}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });

        if (confirmed) {
            deleteMutation.mutate(year.id);
        }
    };

    const handleActivate = async (year: AcademicYear) => {
        const confirmed = await confirm({
            title: 'Activate Academic Year',
            message: `Are you sure you want to set "${year.name}" as the current academic year? This will affect all modules.`,
            confirmLabel: 'Activate',
            variant: 'default',
        });

        if (confirmed) {
            activateMutation.mutate(year.id);
        }
    };

    const columns: Column<AcademicYear>[] = [
        {
            key: 'name',
            header: 'Name',
            accessor: 'name',
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{String(value)}</span>
                    {row.isCurrent && (
                        <Badge variant="success">Current</Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'startDate',
            header: 'Start Date',
            accessor: (row) => new Date(row.startDate).toLocaleDateString(),
        },
        {
            key: 'endDate',
            header: 'End Date',
            accessor: (row) => new Date(row.endDate).toLocaleDateString(),
        },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            render: (value) => (
                <Badge variant={value === 'active' ? 'success' : 'default'}>
                    {String(value)}
                </Badge>
            ),
        },
    ];

    const actions: RowAction<AcademicYear>[] = [
        {
            label: 'View',
            icon: <Eye className="h-3 w-3" />,
            onClick: (row) => router.push(`/academic/years/${row.id}`),
        },
        {
            label: 'Edit',
            icon: <Edit className="h-3 w-3" />,
            onClick: (row) => router.push(`/academic/years/${row.id}?edit=true`),
            show: (row) => !row.isCurrent,
        },
        {
            label: 'Activate',
            icon: <Play className="h-3 w-3" />,
            onClick: handleActivate,
            show: (row) => !row.isCurrent,
        },
        {
            label: 'Delete',
            icon: <Trash2 className="h-3 w-3" />,
            onClick: handleDelete,
            variant: 'danger',
            show: (row) => !row.isCurrent,
        },
    ];

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        return <PageError onRetry={refetch} />;
    }

    const years = data?.data ?? [];
    const pagination = data?.pagination;

    return (
        <WithFeature flag="academic.enabled">
            <PageContent>
                <PageHeader
                    title="Academic Years"
                    subtitle="Manage academic year cycles and sessions"
                    actions={
                        <WithPermission permission="academic_year:create:tenant">
                            <Button onClick={() => router.push('/academic/years/create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Year
                            </Button>
                        </WithPermission>
                    }
                />

                <Card>
                    <DataTable
                        columns={columns}
                        data={years}
                        keyAccessor="id"
                        actions={actions}
                        emptyState={{
                            title: 'No academic years',
                            description: 'Create your first academic year to get started',
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
