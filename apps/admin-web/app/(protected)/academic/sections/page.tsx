'use client';

/**
 * Sections List Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, Users } from 'lucide-react';
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
import { academicClient, type Section } from '@school-erp/api-client';

export default function SectionsPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(
        () => academicClient.sections.list({ page, limit: 20 })
    );

    const deleteMutation = useMutation(
        (id: string) => academicClient.sections.delete(id),
        {
            onSuccess: () => {
                toast.success('Section deleted successfully');
                refetch();
            },
            onError: (error) => {
                toast.error(error.message);
            },
        }
    );

    const handleDelete = async (section: Section) => {
        const confirmed = await confirm({
            title: 'Delete Section',
            message: `Are you sure you want to delete "${section.name}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });

        if (confirmed) {
            deleteMutation.mutate(section.id);
        }
    };

    const columns: Column<Section>[] = [
        {
            key: 'name',
            header: 'Section Name',
            accessor: 'name',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{String(value)}</span>
                </div>
            ),
        },
        {
            key: 'code',
            header: 'Code',
            accessor: 'code',
        },
        {
            key: 'class',
            header: 'Class',
            accessor: (row) => row.class?.name ?? '—',
        },
        {
            key: 'classTeacher',
            header: 'Class Teacher',
            accessor: (row) => row.classTeacher?.name ?? 'Not assigned',
        },
        {
            key: 'capacity',
            header: 'Capacity',
            accessor: 'capacity',
            align: 'center',
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

    const actions: RowAction<Section>[] = [
        {
            label: 'View',
            icon: <Eye className="h-3 w-3" />,
            onClick: (row) => router.push(`/academic/sections/${row.id}`),
        },
        {
            label: 'Edit',
            icon: <Edit className="h-3 w-3" />,
            onClick: (row) => router.push(`/academic/sections/${row.id}?edit=true`),
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

    const sections = data?.data ?? [];
    const pagination = data?.pagination;

    return (
        <WithFeature flag="academic.enabled">
            <PageContent>
                <PageHeader
                    title="Sections"
                    subtitle="Organize class sections and assign teachers"
                    actions={
                        <WithPermission permission="section:create:branch">
                            <Button onClick={() => router.push('/academic/sections/create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Section
                            </Button>
                        </WithPermission>
                    }
                />

                <Card>
                    <DataTable
                        columns={columns}
                        data={sections}
                        keyAccessor="id"
                        actions={actions}
                        emptyState={{
                            title: 'No sections found',
                            description: 'Create your first section to get started',
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
