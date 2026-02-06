'use client';

/**
 * Exam Schedules List Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Calendar, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { DataTable, type Column, type RowAction } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { examsClient, type ExamSchedule } from '@school-erp/api-client';

export default function ExamSchedulesPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(
        () => examsClient.schedules.list({ page, limit: 25 })
    );

    const columns: Column<ExamSchedule>[] = [
        {
            key: 'exam',
            header: 'Exam',
            accessor: (row) => row.exam?.name ?? '—',
        },
        {
            key: 'subject',
            header: 'Subject',
            accessor: (row) => row.subject?.name ?? '—',
        },
        {
            key: 'class',
            header: 'Class',
            accessor: (row) => `${row.class?.name ?? ''} - ${row.section?.name ?? ''}`,
        },
        {
            key: 'date',
            header: 'Date',
            accessor: (row) => new Date(row.date).toLocaleDateString(),
            render: (value) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {String(value)}
                </div>
            ),
        },
        {
            key: 'time',
            header: 'Time',
            accessor: (row) => `${row.startTime} - ${row.endTime}`,
            render: (value) => (
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {String(value)}
                </div>
            ),
        },
    ];

    const actions: RowAction<ExamSchedule>[] = [
        {
            label: 'View',
            icon: <Eye className="h-3 w-3" />,
            onClick: (row) => router.push(`/exams/schedules/${row.id}`),
        },
    ];

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        return <PageError onRetry={refetch} />;
    }

    const schedules = data?.data ?? [];
    const pagination = data?.pagination;

    return (
        <WithFeature flag="exams.enabled">
            <PageContent>
                <PageHeader
                    title="Exam Schedules"
                    subtitle="View and manage exam date schedules"
                    actions={
                        <WithPermission permission="exam:create:branch">
                            <Button onClick={() => router.push('/exams/schedules/create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Schedule
                            </Button>
                        </WithPermission>
                    }
                />

                <Card>
                    <DataTable
                        columns={columns}
                        data={schedules}
                        keyAccessor="id"
                        actions={actions}
                        emptyState={{
                            title: 'No schedules',
                            description: 'Add exam schedules to organize your exams',
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
