'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Form, FormSection, FormActions } from '@/components/ui/Form';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery, useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { libraryClient, isApiError } from '@school-erp/api-client';

interface PageProps { params: { id: string }; }

export default function BookDetailPage({ params }: PageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const confirm = useConfirm();
    const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
    const [formData, setFormData] = useState({ title: '', author: '', isbn: '', totalCopies: '', category: '' });

    const { data: book, isLoading, isError, refetch } = useQuery(() => libraryClient.books.get(params.id));

    useEffect(() => { if (book) setFormData({ title: book.title, author: book.author ?? '', isbn: book.isbn ?? '', totalCopies: String(book.totalCopies), category: book.category ?? '' }); }, [book]);

    const updateMutation = useMutation(() => libraryClient.books.update(params.id, { title: formData.title, author: formData.author, isbn: formData.isbn || undefined, totalCopies: parseInt(formData.totalCopies, 10), category: formData.category || undefined }), {
        onSuccess: () => { toast.success('Updated'); setIsEditing(false); refetch(); },
        onError: (e) => toast.error(isApiError(e) ? e.message : 'Failed'),
    });

    const deleteMutation = useMutation(() => libraryClient.books.delete(params.id), {
        onSuccess: () => { toast.success('Deleted'); router.push('/library/books'); },
        onError: (e) => toast.error(isApiError(e) ? e.message : 'Cannot delete'),
    });

    const handleDelete = async () => { if (await confirm({ title: 'Delete Book', message: 'Delete this book?', confirmLabel: 'Delete', variant: 'danger' })) deleteMutation.mutate(undefined); };

    if (isLoading) return <PageLoader />;
    if (isError || !book) return <PageError onRetry={refetch} />;

    const avail = book.availableCopies ?? 0;
    const total = book.totalCopies ?? 1;

    return (
        <WithFeature flag="library.enabled">
            <PageContent>
                <PageHeader title={book.title} actions={
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        {!isEditing && (
                            <>
                                <WithPermission permission="library_book:update:branch"><Button onClick={() => setIsEditing(true)}>Edit</Button></WithPermission>
                                <WithPermission permission="library_book:delete:branch"><Button variant="danger" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button></WithPermission>
                            </>
                        )}
                    </div>
                } />
                <Card>
                    <div className="flex items-center gap-4">
                        <BookOpen className="h-8 w-8 text-primary-500" />
                        <div><p className="text-sm text-gray-500">Availability</p><p className="text-xl font-bold">{avail} / {total}</p></div>
                        <Badge variant={avail === 0 ? 'error' : avail < total / 2 ? 'warning' : 'success'}>{avail === 0 ? 'Out of Stock' : 'Available'}</Badge>
                    </div>
                </Card>
                <Card title="Details">
                    {isEditing ? (
                        <Form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(undefined); }} isSubmitting={updateMutation.isLoading}>
                            <FormSection>
                                <FormField name="title" label="Title" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} required />
                                <FormField name="author" label="Author" value={formData.author} onChange={(e) => setFormData((p) => ({ ...p, author: e.target.value }))} required />
                                <FormField name="isbn" label="ISBN" value={formData.isbn} onChange={(e) => setFormData((p) => ({ ...p, isbn: e.target.value }))} />
                                <FormField name="totalCopies" label="Total Copies" type="number" value={formData.totalCopies} onChange={(e) => setFormData((p) => ({ ...p, totalCopies: e.target.value }))} required min={1} />
                            </FormSection>
                            <FormActions>
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button type="submit" isLoading={updateMutation.isLoading}><Save className="mr-2 h-4 w-4" />Save</Button>
                            </FormActions>
                        </Form>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div><p className="text-sm text-gray-500">Title</p><p className="font-medium">{book.title}</p></div>
                            <div><p className="text-sm text-gray-500">Author</p><p className="font-medium">{book.author}</p></div>
                            <div><p className="text-sm text-gray-500">ISBN</p><p className="font-medium">{book.isbn ?? '—'}</p></div>
                            <div><p className="text-sm text-gray-500">Category</p><p className="font-medium">{book.category ?? '—'}</p></div>
                        </div>
                    )}
                </Card>
            </PageContent>
        </WithFeature>
    );
}
