'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, BookOpen } from 'lucide-react';
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
import { libraryClient, type Book } from '@school-erp/api-client';

export default function BooksListPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery(() => libraryClient.books.list({ page, limit: 20 }));

    const deleteMutation = useMutation((id: string) => libraryClient.books.delete(id), {
        onSuccess: () => { toast.success('Book deleted'); refetch(); },
        onError: (e) => toast.error(e.message || 'Cannot delete book with active issues'),
    });

    const handleDelete = async (book: Book) => {
        if (await confirm({ title: 'Delete Book', message: `Delete "${book.title}"?`, confirmLabel: 'Delete', variant: 'danger' })) deleteMutation.mutate(book.id);
    };

    const columns: Column<Book>[] = [
        { key: 'title', header: 'Title', accessor: 'title', render: (v) => <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-gray-400" /><span className="font-medium">{String(v)}</span></div> },
        { key: 'author', header: 'Author', accessor: 'author' },
        { key: 'isbn', header: 'ISBN', accessor: 'isbn' },
        {
            key: 'copies', header: 'Available', accessor: (row) => `${row.availableCopies ?? 0}/${row.totalCopies ?? 0}`,
            render: (_, row) => {
                const avail = row.availableCopies ?? 0;
                const total = row.totalCopies ?? 1;
                return <Badge variant={avail === 0 ? 'error' : avail < total / 2 ? 'warning' : 'success'}>{avail}/{total}</Badge>;
            }
        },
        { key: 'category', header: 'Category', accessor: 'category' },
    ];

    const actions: RowAction<Book>[] = [
        { label: 'View', icon: <Eye className="h-3 w-3" />, onClick: (row) => router.push(`/library/books/${row.id}`) },
        { label: 'Edit', icon: <Edit className="h-3 w-3" />, onClick: (row) => router.push(`/library/books/${row.id}?edit=true`) },
        { label: 'Delete', icon: <Trash2 className="h-3 w-3" />, onClick: handleDelete, variant: 'danger' },
    ];

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    return (
        <WithFeature flag="library.enabled">
            <PageContent>
                <PageHeader title="Books" subtitle="Manage book inventory" actions={
                    <WithPermission permission="library_book:create:branch">
                        <Button onClick={() => router.push('/library/books/create')}><Plus className="mr-2 h-4 w-4" />Add Book</Button>
                    </WithPermission>
                } />
                <Card>
                    <DataTable columns={columns} data={data?.data ?? []} keyAccessor="id" actions={actions}
                        emptyState={{ title: 'No books', description: 'Add your first book to the library' }}
                        pagination={data?.pagination ? { currentPage: data.pagination.page, totalPages: data.pagination.totalPages, onPageChange: setPage } : undefined}
                    />
                </Card>
            </PageContent>
        </WithFeature>
    );
}
