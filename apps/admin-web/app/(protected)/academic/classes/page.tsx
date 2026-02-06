'use client';

/**
 * Classes List Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, GraduationCap } from 'lucide-react';
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
import { academicClient, type Class } from '@school-erp/api-client';

export default function ClassesPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(
        () => academicClient.classes.list({ page, limit: 20 })
    );

    const deleteMutation = useMutation(
        (id: string) => academicClient.classes.delete(id),
        {
            onSuccess: () => {
                toast.success('Class deleted successfully');
                refetch();
            },
            onError: (error) => {
                toast.error(error.message);
            },
        }
    );

    const handleDelete = async (classItem: Class) => {
        const confirmed = await confirm({
            title: 'Delete Class',
            message: `Are you sure you want to delete "${classItem.name}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });

        if (confirmed) {
            deleteMutation.mutate(classItem.id);
        }
    };

    const columns: Column<Class>[] = [
        {
            key: 'name',
            header: 'Class Name',
            accessor: 'name',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
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
            key: 'grade',
            header: 'Grade',
            accessor: 'grade',
        },
        {
            key: 'academicYear',
            header: 'Academic Year',
            accessor: (row) => row.academicYear?.name ?? '—',
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

    const actions: RowAction<Class>[] = [
        {
            label: 'View',
            icon: <Eye className="h-3 w-3" />,
            onClick: (row) => router.push(`/academic/classes/${row.id}`),
        },
        {
            label: 'Edit',
            icon: <Edit className="h-3 w-3" />,
            onClick: (row) => router.push(`/academic/classes/${row.id}?edit=true`),
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

    const classes = data?.data ?? [];
    const pagination = data?.pagination;

    return (
        <WithFeature flag="academic.enabled">
            <PageContent>
                <PageHeader
                    title="Classes"
                    subtitle="Configure classes and grade levels"
                    actions={
                        <WithPermission permission="class:create:branch">
                            <Button onClick={() => router.push('/academic/classes/create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Class
                            </Button>
                        </WithPermission>
                    }
                />

                <Card>
                    <DataTable<Class>
                        columns={columns}
                        data={classes}
                        keyAccessor="id"
                        actions={actions}
                        emptyState={{
                            title: 'No classes found',
                            description: 'Create your first class to get started',
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
