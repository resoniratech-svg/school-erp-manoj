'use client';

/**
 * Marks Entry Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Award, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { DataTable, type Column, type RowAction } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { examsClient, type Exam } from '@school-erp/api-client';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
    draft: 'default',
    scheduled: 'warning',
    published: 'success',
    completed: 'info',
};

export default function MarksEntryPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(
        () => examsClient.list({ page, limit: 20 })
    );

    const columns: Column<Exam>[] = [
        {
            key: 'name',
            header: 'Exam',
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
        },
        {
            key: 'dates',
            header: 'Dates',
            accessor: (row) =>
                `${new Date(row.startDate).toLocaleDateString()} - ${new Date(row.endDate).toLocaleDateString()}`,
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
            label: 'Enter/View Marks',
            icon: <Award className="h-3 w-3" />,
            onClick: (row) => router.push(`/exams/marks/${row.id}`),
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
                    title="Marks Entry"
                    subtitle="Enter and view student marks by exam"
                />

                <Card>
                    <DataTable
                        columns={columns}
                        data={exams}
                        keyAccessor="id"
                        actions={actions}
                        emptyState={{
                            title: 'No exams',
                            description: 'Create exams first to enter marks',
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
