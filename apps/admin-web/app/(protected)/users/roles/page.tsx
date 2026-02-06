'use client';

/**
 * Roles List Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, Shield } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { DataTable, type Column, type RowAction } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { useQuery, useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { rolesClient, type Role } from '@school-erp/api-client';

export default function RolesListPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(
        () => rolesClient.list({ page, limit: 20 })
    );

    const deleteMutation = useMutation(
        (id: string) => rolesClient.delete(id),
        {
            onSuccess: () => {
                toast.success('Role deleted successfully');
                refetch();
            },
            onError: (error) => {
                toast.error(error.message);
            },
        }
    );

    const handleDelete = async (role: Role) => {
        if (role.type === 'system') {
            toast.error('System roles cannot be deleted');
            return;
        }

        const confirmed = await confirm({
            title: 'Delete Role',
            message: `Are you sure you want to delete the "${role.name}" role? Users with this role will lose these permissions.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });

        if (confirmed) {
            deleteMutation.mutate(role.id);
        }
    };

    const columns: Column<Role>[] = [
        {
            key: 'name',
            header: 'Role Name',
            accessor: 'name',
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{String(value)}</span>
                    {row.type === 'system' && (
                        <Badge variant="info">System</Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            accessor: 'type',
            render: (value) => (
                <Badge variant={value === 'system' ? 'info' : 'default'}>
                    {String(value)}
                </Badge>
            ),
        },
        {
            key: 'permissions',
            header: 'Permissions',
            accessor: (row) => row.permissions.length,
            render: (value) => (
                <span className="text-gray-600">{String(value)} permissions</span>
            ),
        },
    ];

    const actions: RowAction<Role>[] = [
        {
            label: 'View',
            icon: <Eye className="h-3 w-3" />,
            onClick: (row) => router.push(`/users/roles/${row.id}`),
        },
        {
            label: 'Edit',
            icon: <Edit className="h-3 w-3" />,
            onClick: (row) => router.push(`/users/roles/${row.id}?edit=true`),
            show: (row) => row.type !== 'system',
        },
        {
            label: 'Delete',
            icon: <Trash2 className="h-3 w-3" />,
            onClick: handleDelete,
            variant: 'danger',
            show: (row) => row.type !== 'system',
        },
    ];

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        return <PageError onRetry={refetch} />;
    }

    const roles = data?.data ?? [];
    const pagination = data?.pagination;

    return (
        <PageContent>
            <PageHeader
                title="Roles"
                subtitle="Manage roles and permissions"
                actions={
                    <WithPermission permission="role:create:tenant">
                        <Button onClick={() => router.push('/users/roles/create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Role
                        </Button>
                    </WithPermission>
                }
            />

            <Card>
                <DataTable
                    columns={columns}
                    data={roles}
                    keyAccessor="id"
                    actions={actions}
                    emptyState={{
                        title: 'No roles found',
                        description: 'Create your first custom role',
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
    );
}
