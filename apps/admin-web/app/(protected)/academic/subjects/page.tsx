'use client';

/**
 * Subjects List Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, BookOpen } from 'lucide-react';
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
import { academicClient, type Subject } from '@school-erp/api-client';

const SUBJECT_TYPE_LABELS: Record<string, string> = {
    core: 'Core',
    elective: 'Elective',
    extra: 'Extra',
};

const SUBJECT_TYPE_VARIANTS: Record<string, 'default' | 'success' | 'info' | 'warning'> = {
    core: 'success',
    elective: 'info',
    extra: 'warning',
};

export default function SubjectsPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(
        () => academicClient.subjects.list({ page, limit: 20 })
    );

    const deleteMutation = useMutation(
        (id: string) => academicClient.subjects.delete(id),
        {
            onSuccess: () => {
                toast.success('Subject deleted successfully');
                refetch();
            },
            onError: (error) => {
                toast.error(error.message);
            },
        }
    );

    const handleDelete = async (subject: Subject) => {
        const confirmed = await confirm({
            title: 'Delete Subject',
            message: `Are you sure you want to delete "${subject.name}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });

        if (confirmed) {
            deleteMutation.mutate(subject.id);
        }
    };

    const columns: Column<Subject>[] = [
        {
            key: 'name',
            header: 'Subject Name',
            accessor: 'name',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-400" />
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
            key: 'type',
            header: 'Type',
            accessor: 'type',
            render: (value) => (
                <Badge variant={SUBJECT_TYPE_VARIANTS[String(value)] ?? 'default'}>
                    {SUBJECT_TYPE_LABELS[String(value)] ?? String(value)}
                </Badge>
            ),
        },
    ];

    const actions: RowAction<Subject>[] = [
        {
            label: 'View',
            icon: <Eye className="h-3 w-3" />,
            onClick: (row) => router.push(`/academic/subjects/${row.id}`),
        },
        {
            label: 'Edit',
            icon: <Edit className="h-3 w-3" />,
            onClick: (row) => router.push(`/academic/subjects/${row.id}?edit=true`),
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

    const subjects = data?.data ?? [];
    const pagination = data?.pagination;

    return (
        <WithFeature flag="academic.enabled">
            <PageContent>
                <PageHeader
                    title="Subjects"
                    subtitle="Define subjects and curriculum structure"
                    actions={
                        <WithPermission permission="subject:create:tenant">
                            <Button onClick={() => router.push('/academic/subjects/create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Subject
                            </Button>
                        </WithPermission>
                    }
                />

                <Card>
                    <DataTable
                        columns={columns}
                        data={subjects}
                        keyAccessor="id"
                        actions={actions}
                        emptyState={{
                            title: 'No subjects found',
                            description: 'Create your first subject to get started',
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
