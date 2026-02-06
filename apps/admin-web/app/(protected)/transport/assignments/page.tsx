'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Trash2, Users } from 'lucide-react';
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
import { transportClient, type TransportAssignment } from '@school-erp/api-client';

export default function AssignmentsListPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(() => transportClient.assignments.list({ page, limit: 20 }));

    const deleteMutation = useMutation((id: string) => transportClient.assignments.delete(id), {
        onSuccess: () => { toast.success('Assignment removed'); refetch(); },
        onError: (e) => toast.error(e.message || 'Failed'),
    });

    const handleDelete = async (a: TransportAssignment) => {
        if (await confirm({ title: 'Remove Assignment', message: `Remove ${a.student?.name} from route?`, confirmLabel: 'Remove', variant: 'danger' })) deleteMutation.mutate(a.id);
    };

    const columns: Column<TransportAssignment>[] = [
        { key: 'student', header: 'Student', accessor: (row) => row.student?.name ?? '—', render: (v) => <div className="flex items-center gap-2"><Users className="h-4 w-4 text-gray-400" /><span className="font-medium">{String(v)}</span></div> },
        { key: 'route', header: 'Route', accessor: (row) => row.route?.name ?? '—' },
        { key: 'stop', header: 'Stop', accessor: (row) => row.stop?.name ?? '—' },
        { key: 'status', header: 'Status', accessor: 'status', render: (v) => <Badge variant={v === 'active' ? 'success' : 'default'}>{String(v)}</Badge> },
    ];

    const actions: RowAction<TransportAssignment>[] = [
        { label: 'View', icon: <Eye className="h-3 w-3" />, onClick: (row) => router.push(`/transport/assignments/${row.id}`) },
        { label: 'Remove', icon: <Trash2 className="h-3 w-3" />, onClick: handleDelete, variant: 'danger' },
    ];

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    return (
        <WithFeature flag="transport.enabled">
            <PageContent>
                <PageHeader title="Student Assignments" subtitle="Students assigned to routes" actions={
                    <WithPermission permission="transport_assign:create:branch">
                        <Button onClick={() => router.push('/transport/assignments/create')}><Plus className="mr-2 h-4 w-4" />Assign Student</Button>
                    </WithPermission>
                } />
                <Card>
                    <DataTable columns={columns} data={data?.data ?? []} keyAccessor="id" actions={actions}
                        emptyState={{ title: 'No assignments', description: 'Assign students to routes' }}
                        pagination={data?.pagination ? { currentPage: data.pagination.page, totalPages: data.pagination.totalPages, onPageChange: setPage } : undefined}
                    />
                </Card>
            </PageContent>
        </WithFeature>
    );
}
