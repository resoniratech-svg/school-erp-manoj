'use client';

import { useState } from 'react';
import { Lock, Users, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { reportsClient, type PromotionStatus } from '@school-erp/api-client';

export default function PromotionPage() {
    const [page, setPage] = useState(1);
    const [classId, _] = useState('');

    const { data, isLoading, isError, refetch } = useQuery(() => reportsClient.promotion.list({ page, limit: 25, classId: classId || undefined }));

    const columns: Column<PromotionStatus>[] = [
        { key: 'student', header: 'Student', accessor: (row) => row.student?.name ?? '—', render: (v) => <div className="flex items-center gap-2"><Users className="h-4 w-4 text-gray-400" /><span className="font-medium">{String(v)}</span></div> },
        { key: 'class', header: 'Current Class', accessor: (row) => row.currentClass ?? '—' },
        { key: 'percentage', header: 'Percentage', accessor: 'percentage', align: 'right', render: (v) => <span>{String(v)}%</span> },
        { key: 'attendance', header: 'Attendance', accessor: 'attendancePercentage', align: 'right', render: (v) => <span className={Number(v) < 75 ? 'text-red-600' : ''}>{String(v)}%</span> },
        {
            key: 'eligible', header: 'Eligible', accessor: 'isEligible',
            render: (v) => v ? <div className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" />Yes</div> : <div className="flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4" />No</div>
        },
        { key: 'status', header: 'Status', accessor: 'status', render: (v) => <Badge variant={v === 'promoted' ? 'success' : v === 'detained' ? 'error' : 'warning'}>{String(v)}</Badge> },
    ];

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    return (
        <WithFeature flag="reports.enabled">
            <PageContent>
                <PageHeader title="Promotion Status" subtitle="View promotion eligibility (read-only)" />
                <Card className="border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-3"><Lock className="h-5 w-5 text-blue-600" /><p className="text-sm text-blue-700">Promotion eligibility is determined by backend rules. No manual override available.</p></div>
                </Card>
                <Card>
                    <DataTable columns={columns} data={data?.data ?? []} keyAccessor="id"
                        emptyState={{ title: 'No promotion data', description: 'Promotion status will appear after exams are finalized' }}
                        pagination={data?.pagination ? { currentPage: data.pagination.page, totalPages: data.pagination.totalPages, onPageChange: setPage } : undefined}
                    />
                </Card>
            </PageContent>
        </WithFeature>
    );
}
