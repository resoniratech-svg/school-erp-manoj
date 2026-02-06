'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, Route as RouteIcon } from 'lucide-react';
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
import { transportClient, type TransportRoute } from '@school-erp/api-client';

export default function RoutesListPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(
        () => transportClient.routes.list({ page, limit: 20 })
    );

    const deleteMutation = useMutation(
        (id: string) => transportClient.routes.delete(id),
        {
            onSuccess: () => {
                toast.success('Route deleted');
                refetch();
            },
            onError: (error) => {
                toast.error(error.message || 'Cannot delete route with active assignments');
            },
        }
    );

    const handleDelete = async (route: TransportRoute) => {
        const confirmed = await confirm({
            title: 'Delete Route',
            message: `Delete "${route.name}"? This will fail if students are assigned.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (confirmed) deleteMutation.mutate(route.id);
    };

    const columns: Column<TransportRoute>[] = [
        {
            key: 'name',
            header: 'Route Name',
            accessor: 'name',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <RouteIcon className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{String(value)}</span>
                </div>
            ),
        },
        { key: 'code', header: 'Code', accessor: 'code' },
        { key: 'stops', header: 'Stops', accessor: (row) => row.stops?.length ?? 0, align: 'center' },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            render: (value) => <Badge variant={value === 'active' ? 'success' : 'default'}>{String(value)}</Badge>,
        },
    ];

    const actions: RowAction<TransportRoute>[] = [
        { label: 'View', icon: <Eye className="h-3 w-3" />, onClick: (row) => router.push(`/transport/routes/${row.id}`) },
        { label: 'Edit', icon: <Edit className="h-3 w-3" />, onClick: (row) => router.push(`/transport/routes/${row.id}?edit=true`) },
        { label: 'Delete', icon: <Trash2 className="h-3 w-3" />, onClick: handleDelete, variant: 'danger' },
    ];

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    const routes = data?.data ?? [];
    const pagination = data?.pagination;

    return (
        <WithFeature flag="transport.enabled">
            <PageContent>
                <PageHeader
                    title="Routes"
                    subtitle="Manage transport routes"
                    actions={
                        <WithPermission permission="transport_route:create:branch">
                            <Button onClick={() => router.push('/transport/routes/create')}>
                                <Plus className="mr-2 h-4 w-4" />Add Route
                            </Button>
                        </WithPermission>
                    }
                />
                <Card>
                    <DataTable
                        columns={columns}
                        data={routes}
                        keyAccessor="id"
                        actions={actions}
                        emptyState={{ title: 'No routes', description: 'Create your first route' }}
                        pagination={pagination ? { currentPage: pagination.page, totalPages: pagination.totalPages, onPageChange: setPage } : undefined}
                    />
                </Card>
            </PageContent>
        </WithFeature>
    );
}
