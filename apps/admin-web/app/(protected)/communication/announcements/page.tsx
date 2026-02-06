'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Play, Megaphone, Lock } from 'lucide-react';
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
import { communicationClient, type Announcement } from '@school-erp/api-client';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'info'> = { draft: 'default', published: 'success', archived: 'info' };

export default function AnnouncementsListPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(() => communicationClient.announcements.list({ page, limit: 20 }));

    const publishMutation = useMutation((id: string) => communicationClient.announcements.publish(id), {
        onSuccess: () => { toast.success('Announcement published'); refetch(); },
        onError: (e) => toast.error(e.message || 'Failed'),
    });

    const handlePublish = async (a: Announcement) => {
        if (await confirm({ title: 'Publish Announcement', message: `Publish "${a.title}"? This is irreversible.`, confirmLabel: 'Publish', variant: 'default' })) publishMutation.mutate(a.id);
    };

    const columns: Column<Announcement>[] = [
        { key: 'title', header: 'Title', accessor: 'title', render: (v, row) => <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-gray-400" /><span className="font-medium">{String(v)}</span>{row.status === 'published' && <Lock className="h-3 w-3 text-gray-400" />}</div> },
        { key: 'audience', header: 'Audience', accessor: 'audience' },
        { key: 'createdAt', header: 'Created', accessor: (row) => new Date(row.createdAt).toLocaleDateString() },
        { key: 'status', header: 'Status', accessor: 'status', render: (v) => <Badge variant={STATUS_VARIANTS[String(v)] ?? 'default'}>{String(v)}</Badge> },
    ];

    const actions: RowAction<Announcement>[] = [
        { label: 'View', icon: <Eye className="h-3 w-3" />, onClick: (row) => router.push(`/communication/announcements/${row.id}`) },
        { label: 'Publish', icon: <Play className="h-3 w-3" />, onClick: handlePublish, show: (row) => row.status === 'draft' },
    ];

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    return (
        <WithFeature flag="communication.enabled">
            <PageContent>
                <PageHeader title="Announcements" subtitle="Create and publish announcements" actions={
                    <WithPermission permission="announcement:create:branch">
                        <Button onClick={() => router.push('/communication/announcements/create')}><Plus className="mr-2 h-4 w-4" />Create Draft</Button>
                    </WithPermission>
                } />
                <Card>
                    <DataTable columns={columns} data={data?.data ?? []} keyAccessor="id" actions={actions}
                        emptyState={{ title: 'No announcements', description: 'Create your first announcement' }}
                        pagination={data?.pagination ? { currentPage: data.pagination.page, totalPages: data.pagination.totalPages, onPageChange: setPage } : undefined}
                    />
                </Card>
            </PageContent>
        </WithFeature>
    );
}
