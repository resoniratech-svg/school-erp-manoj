'use client';

/**
 * Template Page (Reference Only)
 * Demonstrates how to build a module page using the foundation
 * NOT linked in navigation - for developer reference only
 */

import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { DataTable, type Column, type RowAction } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';

// Example data type (generic, not business-specific)
interface ExampleItem {
    id: string;
    name: string;
    status: 'active' | 'inactive';
    createdAt: string;
}

// Mock data fetching (in real module, use API client)
const fetchExampleData = async (): Promise<ExampleItem[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return [
        { id: '1', name: 'Item One', status: 'active', createdAt: '2024-01-15' },
        { id: '2', name: 'Item Two', status: 'inactive', createdAt: '2024-01-14' },
        { id: '3', name: 'Item Three', status: 'active', createdAt: '2024-01-13' },
    ];
};

export default function TemplatePage() {
    // Data fetching with useQuery hook
    const { data, isLoading, isError, refetch } = useQuery(fetchExampleData);

    // Column configuration
    const columns: Column<ExampleItem>[] = [
        {
            key: 'name',
            header: 'Name',
            accessor: 'name',
        },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            render: (value) => (
                <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${value === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                        }`}
                >
                    {String(value)}
                </span>
            ),
        },
        {
            key: 'createdAt',
            header: 'Created',
            accessor: 'createdAt',
        },
    ];

    // Row actions (permission-aware in real implementation)
    const actions: RowAction<ExampleItem>[] = [
        {
            label: 'Edit',
            icon: <Edit className="h-3 w-3" />,
            onClick: (row) => console.log('Edit:', row.id),
        },
        {
            label: 'Delete',
            icon: <Trash2 className="h-3 w-3" />,
            onClick: (row) => console.log('Delete:', row.id),
            variant: 'danger',
        },
    ];

    // Loading state
    if (isLoading) {
        return <PageLoader />;
    }

    // Error state
    if (isError) {
        return <PageError onRetry={refetch} />;
    }

    return (
        <PageContent>
            {/* Page Header with permission-aware action */}
            <PageHeader
                title="Template Page"
                subtitle="This is a reference template for building module pages"
                actions={
                    <WithPermission permission="example:create:tenant">
                        <WithFeature flag="example.enabled">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                        </WithFeature>
                    </WithPermission>
                }
            />

            {/* Data Table */}
            <Card>
                <DataTable<ExampleItem>
                    columns={columns}
                    data={data ?? []}
                    keyAccessor="id"
                    actions={actions}
                    emptyState={{
                        title: 'No items found',
                        description: 'Create your first item to get started',
                    }}
                    pagination={{
                        currentPage: 1,
                        totalPages: 1,
                        onPageChange: (page) => console.log('Page:', page),
                    }}
                />
            </Card>
        </PageContent>
    );
}
