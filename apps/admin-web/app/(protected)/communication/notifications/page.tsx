'use client';

import { useState } from 'react';
import { Bell, Lock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { communicationClient, type Notification } from '@school-erp/api-client';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    pending: 'warning',
    sent: 'success',
    failed: 'error',
    read: 'info',
};

export default function NotificationsListPage() {
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(() => communicationClient.notifications.list({ page, limit: 25 }));

    const columns: Column<Notification>[] = [
        { key: 'title', header: 'Title', accessor: 'title', render: (v) => <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-gray-400" /><span className="font-medium">{String(v)}</span></div> },
        { key: 'recipient', header: 'Recipient', accessor: (row) => row.recipient?.name ?? '—' },
        { key: 'channel', header: 'Channel', accessor: 'channel', render: (v) => <Badge variant="default">{String(v)}</Badge> },
        { key: 'sentAt', header: 'Sent', accessor: (row) => row.sentAt ? new Date(row.sentAt).toLocaleString() : '—' },
        { key: 'status', header: 'Status', accessor: 'status', render: (v) => <Badge variant={STATUS_VARIANTS[String(v)] ?? 'default'}>{String(v)}</Badge> },
    ];

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    return (
        <WithFeature flag="communication.enabled">
            <PageContent>
                <PageHeader title="Notifications" subtitle="Delivery status (read-only)" />
                <Card className="border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-3"><Lock className="h-5 w-5 text-blue-600" /><p className="text-sm text-blue-700">Notifications are read-only. No modifications allowed.</p></div>
                </Card>
                <Card>
                    <DataTable columns={columns} data={data?.data ?? []} keyAccessor="id"
                        emptyState={{ title: 'No notifications', description: 'Notifications will appear here when sent' }}
                        pagination={data?.pagination ? { currentPage: data.pagination.page, totalPages: data.pagination.totalPages, onPageChange: setPage } : undefined}
                    />
                </Card>
            </PageContent>
        </WithFeature>
    );
}
