'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, FileText, Lock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { DataTable, type Column, type RowAction } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { reportsClient, type ReportCard } from '@school-erp/api-client';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning'> = { draft: 'default', published: 'success', pending: 'warning' };

export default function ReportCardsListPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(() => reportsClient.reportCards.list({ page, limit: 20 }));

    const columns: Column<ReportCard>[] = [
        { key: 'student', header: 'Student', accessor: (row) => row.student?.name ?? '—', render: (v) => <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" /><span className="font-medium">{String(v)}</span></div> },
        { key: 'class', header: 'Class', accessor: (row) => row.class?.name ?? '—' },
        { key: 'exam', header: 'Exam', accessor: (row) => row.exam?.name ?? '—' },
        { key: 'status', header: 'Status', accessor: 'status', render: (v, _) => <div className="flex items-center gap-2"><Badge variant={STATUS_VARIANTS[String(v)] ?? 'default'}>{String(v)}</Badge>{v === 'published' && <Lock className="h-3 w-3 text-gray-400" />}</div> },
    ];

    const actions: RowAction<ReportCard>[] = [
        { label: 'View', icon: <Eye className="h-3 w-3" />, onClick: (row) => router.push(`/reports/report-cards/${row.id}`) },
    ];

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    return (
        <WithFeature flag="reports.enabled">
            <PageContent>
                <PageHeader title="Report Cards" subtitle="View student report cards (read-only)" />
                <Card className="border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-3"><Lock className="h-5 w-5 text-blue-600" /><p className="text-sm text-blue-700">Report cards are read-only. Published reports cannot be modified.</p></div>
                </Card>
                <Card>
                    <DataTable columns={columns} data={data?.data ?? []} keyAccessor="id" actions={actions}
                        emptyState={{ title: 'No report cards', description: 'Report cards will appear here after generation' }}
                        pagination={data?.pagination ? { currentPage: data.pagination.page, totalPages: data.pagination.totalPages, onPageChange: setPage } : undefined}
                    />
                </Card>
            </PageContent>
        </WithFeature>
    );
}
