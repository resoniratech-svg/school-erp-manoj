'use client';

/**
 * Users List Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
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
import { usersClient } from '@school-erp/api-client';

interface UserRow {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: 'active' | 'inactive';
    roles: Array<{ id: string; name: string }>;
    branches: Array<{ id: string; name: string }>;
}

export default function UsersListPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(
        () => usersClient.list({ page, limit: 20 })
    );

    const deleteMutation = useMutation(
        (id: string) => usersClient.delete(id),
        {
            onSuccess: () => {
                toast.success('User deleted successfully');
                refetch();
            },
            onError: (error) => {
                toast.error(error.message);
            },
        }
    );

    const handleDelete = async (user: UserRow) => {
        const confirmed = await confirm({
            title: 'Delete User',
            message: `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });

        if (confirmed) {
            deleteMutation.mutate(user.id);
        }
    };

    const columns: Column<UserRow>[] = [
        {
            key: 'name',
            header: 'Name',
            accessor: (row) => `${row.firstName} ${row.lastName}`,
        },
        {
            key: 'email',
            header: 'Email',
            accessor: 'email',
        },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            render: (value) => (
                <Badge variant={value === 'active' ? 'success' : 'default'}>
                    {String(value)}
                </Badge>
            ),
        },
        {
            key: 'roles',
            header: 'Roles',
            accessor: (row) =>
                row.roles.length > 0
                    ? row.roles.map((r) => r.name).join(', ')
                    : '—',
        },
        {
            key: 'branches',
            header: 'Branches',
            accessor: (row) =>
                row.branches.length > 0
                    ? row.branches.map((b) => b.name).join(', ')
                    : 'All',
        },
    ];

    const actions: RowAction<UserRow>[] = [
        {
            label: 'View',
            icon: <Eye className="h-3 w-3" />,
            onClick: (row) => router.push(`/users/${row.id}`),
        },
        {
            label: 'Edit',
            icon: <Edit className="h-3 w-3" />,
            onClick: (row) => router.push(`/users/${row.id}?edit=true`),
        },
        {
            label: 'Delete',
            icon: <Trash2 className="h-3 w-3" />,
            onClick: handleDelete,
            variant: 'danger',
        },
    ];

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        return <PageError onRetry={refetch} />;
    }

    const users = (data?.data ?? []) as UserRow[];
    const pagination = data?.pagination;

    return (
        <PageContent>
            <PageHeader
                title="Users"
                subtitle="Manage user accounts and access"
                actions={
                    <WithPermission permission="user:create:tenant">
                        <Button onClick={() => router.push('/users/create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </WithPermission>
                }
            />

            <Card>
                <DataTable
                    columns={columns}
                    data={users}
                    keyAccessor="id"
                    actions={actions}
                    emptyState={{
                        title: 'No users found',
                        description: 'Create your first user to get started',
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
