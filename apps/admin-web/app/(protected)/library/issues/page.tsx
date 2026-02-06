'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RotateCcw, BookCopy, AlertCircle } from 'lucide-react';
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
import { libraryClient, type BookIssue } from '@school-erp/api-client';

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    issued: 'warning',
    returned: 'success',
    overdue: 'error',
};

export default function IssuesListPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(() => libraryClient.issues.list({ page, limit: 20 }));

    const returnMutation = useMutation((id: string) => libraryClient.issues.return(id), {
        onSuccess: () => { toast.success('Book returned'); refetch(); },
        onError: (e) => toast.error(e.message || 'Failed'),
    });

    const handleReturn = async (issue: BookIssue) => {
        if (await confirm({ title: 'Return Book', message: `Mark "${issue.book?.title}" as returned?`, confirmLabel: 'Return', variant: 'default' })) returnMutation.mutate(issue.id);
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

    const columns: Column<BookIssue>[] = [
        { key: 'book', header: 'Book', accessor: (row) => row.book?.title ?? '—', render: (v) => <div className="flex items-center gap-2"><BookCopy className="h-4 w-4 text-gray-400" /><span className="font-medium">{String(v)}</span></div> },
        { key: 'borrower', header: 'Borrower', accessor: (row) => row.borrower?.name ?? '—' },
        { key: 'type', header: 'Type', accessor: 'borrowerType', render: (v) => <Badge variant="info">{String(v)}</Badge> },
        { key: 'issueDate', header: 'Issued', accessor: (row) => new Date(row.issueDate).toLocaleDateString() },
        { key: 'dueDate', header: 'Due', accessor: (row) => new Date(row.dueDate).toLocaleDateString() },
        { key: 'fine', header: 'Fine', accessor: 'fine', align: 'right', render: (v) => v ? <span className="text-red-600">{formatCurrency(Number(v))}</span> : '—' },
        { key: 'status', header: 'Status', accessor: 'status', render: (v) => <Badge variant={STATUS_VARIANTS[String(v)] ?? 'default'}>{String(v)}</Badge> },
    ];

    const actions: RowAction<BookIssue>[] = [
        { label: 'Return', icon: <RotateCcw className="h-3 w-3" />, onClick: handleReturn, show: (row) => row.status === 'issued' || row.status === 'overdue' },
    ];

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    return (
        <WithFeature flag="library.enabled">
            <PageContent>
                <PageHeader title="Book Issues" subtitle="Track issued and returned books" actions={
                    <WithPermission permission="library_issue:create:branch">
                        <Button onClick={() => router.push('/library/issues/create')}><Plus className="mr-2 h-4 w-4" />Issue Book</Button>
                    </WithPermission>
                } />
                <Card className="border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-3"><AlertCircle className="h-5 w-5 text-blue-600" /><p className="text-sm text-blue-700">Issue records are append-only. Fine amounts are calculated by backend.</p></div>
                </Card>
                <Card>
                    <DataTable columns={columns} data={data?.data ?? []} keyAccessor="id" actions={actions}
                        emptyState={{ title: 'No issues', description: 'Issue a book to get started' }}
                        pagination={data?.pagination ? { currentPage: data.pagination.page, totalPages: data.pagination.totalPages, onPageChange: setPage } : undefined}
                    />
                </Card>
            </PageContent>
        </WithFeature>
    );
}
