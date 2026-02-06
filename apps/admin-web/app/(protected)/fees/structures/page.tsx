'use client';

/**
 * Fee Structures List Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, FileText } from 'lucide-react';
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
import { feesClient, type FeeStructure } from '@school-erp/api-client';

const FEE_TYPE_LABELS: Record<string, string> = {
    tuition: 'Tuition',
    transport: 'Transport',
    library: 'Library',
    lab: 'Laboratory',
    sports: 'Sports',
    exam: 'Examination',
    other: 'Other',
};

const FEE_TYPE_VARIANTS: Record<string, 'default' | 'success' | 'info' | 'warning' | 'error'> = {
    tuition: 'success',
    transport: 'info',
    library: 'warning',
    lab: 'default',
    sports: 'info',
    exam: 'warning',
    other: 'default',
};

export default function FeeStructuresPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(
        () => feesClient.structures.list({ page, limit: 20 })
    );

    const deleteMutation = useMutation(
        (id: string) => feesClient.structures.delete(id),
        {
            onSuccess: () => {
                toast.success('Fee structure deleted successfully');
                refetch();
            },
            onError: (error) => {
                toast.error(error.message || 'Cannot delete fee structure with existing assignments');
            },
        }
    );

    const handleDelete = async (structure: FeeStructure) => {
        const confirmed = await confirm({
            title: 'Delete Fee Structure',
            message: `Are you sure you want to delete "${structure.name}"? This will fail if the structure has existing fee assignments.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });

        if (confirmed) {
            deleteMutation.mutate(structure.id);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const columns: Column<FeeStructure>[] = [
        {
            key: 'name',
            header: 'Fee Name',
            accessor: 'name',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{String(value)}</span>
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            accessor: 'type',
            render: (value) => (
                <Badge variant={FEE_TYPE_VARIANTS[String(value)] ?? 'default'}>
                    {FEE_TYPE_LABELS[String(value)] ?? String(value)}
                </Badge>
            ),
        },
        {
            key: 'amount',
            header: 'Amount',
            accessor: 'amount',
            align: 'right',
            render: (value) => (
                <span className="font-medium text-gray-900">
                    {formatCurrency(Number(value))}
                </span>
            ),
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

    const actions: RowAction<FeeStructure>[] = [
        {
            label: 'View',
            icon: <Eye className="h-3 w-3" />,
            onClick: (row) => router.push(`/fees/structures/${row.id}`),
        },
        {
            label: 'Edit',
            icon: <Edit className="h-3 w-3" />,
            onClick: (row) => router.push(`/fees/structures/${row.id}?edit=true`),
        },
        {
            label: 'Delete',
            icon: <Trash2 className="h-3 w-3" />,
            onClick: handleDelete,
            variant: 'danger',
        },
    ];

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        return <PageError onRetry={refetch} />;
    }

    const structures = data?.data ?? [];
    const pagination = data?.pagination;

    return (
        <WithFeature flag="fees.enabled">
            <PageContent>
                <PageHeader
                    title="Fee Structures"
                    subtitle="Define fee types and amounts"
                    actions={
                        <WithPermission permission="fee_structure:create:tenant">
                            <Button onClick={() => router.push('/fees/structures/create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Structure
                            </Button>
                        </WithPermission>
                    }
                />

                <Card>
                    <DataTable
                        columns={columns}
                        data={structures}
                        keyAccessor="id"
                        actions={actions}
                        emptyState={{
                            title: 'No fee structures',
                            description: 'Create your first fee structure to start assigning fees',
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
