'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, Bus } from 'lucide-react';
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
import { transportClient, type Vehicle } from '@school-erp/api-client';

export default function VehiclesListPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(() => transportClient.vehicles.list({ page, limit: 20 }));

    const deleteMutation = useMutation((id: string) => transportClient.vehicles.delete(id), {
        onSuccess: () => { toast.success('Vehicle deleted'); refetch(); },
        onError: (e) => toast.error(e.message || 'Cannot delete'),
    });

    const handleDelete = async (v: Vehicle) => {
        if (await confirm({ title: 'Delete Vehicle', message: `Delete "${v.registrationNumber}"?`, confirmLabel: 'Delete', variant: 'danger' })) deleteMutation.mutate(v.id);
    };

    const columns: Column<Vehicle>[] = [
        {
            key: 'registrationNumber', header: 'Registration',
            accessor: 'registrationNumber',
            render: (value) => <div className="flex items-center gap-2"><Bus className="h-4 w-4 text-gray-400" /><span className="font-medium">{String(value)}</span></div>,
        },
        { key: 'model', header: 'Model', accessor: 'model' },
        {
            key: 'capacity', header: 'Capacity',
            accessor: (row) => `${row.currentOccupancy ?? 0}/${row.capacity}`,
            render: (value, row) => {
                const pct = row.capacity ? ((row.currentOccupancy ?? 0) / row.capacity) * 100 : 0;
                return <Badge variant={pct >= 90 ? 'error' : pct >= 70 ? 'warning' : 'success'}>{String(value)}</Badge>;
            },
        },
        { key: 'route', header: 'Route', accessor: (row) => row.route?.name ?? '—' },
        { key: 'status', header: 'Status', accessor: 'status', render: (value) => <Badge variant={value === 'active' ? 'success' : 'default'}>{String(value)}</Badge> },
    ];

    const actions: RowAction<Vehicle>[] = [
        { label: 'View', icon: <Eye className="h-3 w-3" />, onClick: (row) => router.push(`/transport/vehicles/${row.id}`) },
        { label: 'Edit', icon: <Edit className="h-3 w-3" />, onClick: (row) => router.push(`/transport/vehicles/${row.id}?edit=true`) },
        { label: 'Delete', icon: <Trash2 className="h-3 w-3" />, onClick: handleDelete, variant: 'danger' },
    ];

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    return (
        <WithFeature flag="transport.enabled">
            <PageContent>
                <PageHeader title="Vehicles" subtitle="Manage buses and capacity" actions={
                    <WithPermission permission="vehicle:create:branch">
                        <Button onClick={() => router.push('/transport/vehicles/create')}><Plus className="mr-2 h-4 w-4" />Add Vehicle</Button>
                    </WithPermission>
                } />
                <Card>
                    <DataTable columns={columns} data={data?.data ?? []} keyAccessor="id" actions={actions}
                        emptyState={{ title: 'No vehicles', description: 'Add your first vehicle' }}
                        pagination={data?.pagination ? { currentPage: data.pagination.page, totalPages: data.pagination.totalPages, onPageChange: setPage } : undefined}
                    />
                </Card>
            </PageContent>
        </WithFeature>
    );
}
