'use client';

/**
 * Exams List Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, Play, FileText, Lock } from 'lucide-react';
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
import { examsClient, type Exam } from '@school-erp/api-client';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
    draft: 'default',
    scheduled: 'warning',
    published: 'success',
    completed: 'info',
};

export default function ExamsListPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(
        () => examsClient.list({ page, limit: 20 })
    );

    const publishMutation = useMutation(
        (id: string) => examsClient.publish(id),
        {
            onSuccess: () => {
                toast.success('Exam published successfully');
                refetch();
            },
            onError: (error) => {
                toast.error(error.message);
            },
        }
    );

    const deleteMutation = useMutation(
        (id: string) => examsClient.delete(id),
        {
            onSuccess: () => {
                toast.success('Exam deleted');
                refetch();
            },
            onError: (error) => {
                toast.error(error.message);
            },
        }
    );

    const handlePublish = async (exam: Exam) => {
        const confirmed = await confirm({
            title: 'Publish Exam',
            message: `Publish "${exam.name}"? After publishing, the exam cannot be edited or deleted.`,
            confirmLabel: 'Publish',
            variant: 'default',
        });

        if (confirmed) {
            publishMutation.mutate(exam.id);
        }
    };

    const handleDelete = async (exam: Exam) => {
        if (exam.status !== 'draft') {
            toast.error('Only draft exams can be deleted');
            return;
        }

        const confirmed = await confirm({
            title: 'Delete Exam',
            message: `Delete "${exam.name}"? This cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });

        if (confirmed) {
            deleteMutation.mutate(exam.id);
        }
    };

    const columns: Column<Exam>[] = [
        {
            key: 'name',
            header: 'Exam Name',
            accessor: 'name',
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{String(value)}</span>
                    {row.status === 'published' && (
                        <Lock className="h-3 w-3 text-gray-400" />
                    )}
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            accessor: 'type',
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
                <Badge variant={STATUS_VARIANTS[String(value)] ?? 'default'}>
                    {String(value)}
                </Badge>
            ),
        },
    ];

    const actions: RowAction<Exam>[] = [
        {
            label: 'View',
            icon: <Eye className="h-3 w-3" />,
            onClick: (row) => router.push(`/exams/exams/${row.id}`),
        },
        {
            label: 'Edit',
            icon: <Edit className="h-3 w-3" />,
            onClick: (row) => router.push(`/exams/exams/${row.id}?edit=true`),
            show: (row) => row.status === 'draft',
        },
        {
            label: 'Publish',
            icon: <Play className="h-3 w-3" />,
            onClick: handlePublish,
            show: (row) => row.status === 'draft',
        },
        {
            label: 'Delete',
            icon: <Trash2 className="h-3 w-3" />,
            onClick: handleDelete,
            variant: 'danger',
            show: (row) => row.status === 'draft',
        },
    ];

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        return <PageError onRetry={refetch} />;
    }

    const exams = data?.data ?? [];
    const pagination = data?.pagination;

    return (
        <WithFeature flag="exams.enabled">
            <PageContent>
                <PageHeader
                    title="Examinations"
                    subtitle="Manage exams and assessments"
                    actions={
                        <WithPermission permission="exam:create:branch">
                            <Button onClick={() => router.push('/exams/exams/create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Exam
                            </Button>
                        </WithPermission>
                    }
                />

                <Card>
                    <DataTable
                        columns={columns}
                        data={exams}
                        keyAccessor="id"
                        actions={actions}
                        emptyState={{
                            title: 'No exams',
                            description: 'Create your first exam to get started',
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
