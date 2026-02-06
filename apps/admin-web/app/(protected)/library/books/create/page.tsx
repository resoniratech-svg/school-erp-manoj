'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Form, FormSection, FormActions } from '@/components/ui/Form';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { WithFeature } from '@/components/auth/WithFeature';
import { useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { libraryClient, isApiError } from '@school-erp/api-client';

export default function CreateBookPage() {
    const router = useRouter();
    const toast = useToast();
    const [formData, setFormData] = useState({ title: '', author: '', isbn: '', totalCopies: '1', category: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useMutation(
        () => libraryClient.books.create({ title: formData.title, author: formData.author, isbn: formData.isbn || undefined, totalCopies: parseInt(formData.totalCopies, 10), category: formData.category || undefined }),
        {
            onSuccess: (book) => { toast.success('Book added'); router.push(`/library/books/${book.id}`); },
            onError: (e) => toast.error(isApiError(e) ? e.message : 'Failed'),
        }
    );

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.title.trim()) e.title = 'Required';
        if (!formData.author.trim()) e.author = 'Required';
        if (!formData.totalCopies || parseInt(formData.totalCopies, 10) < 1) e.totalCopies = 'Must be at least 1';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) createMutation.mutate(undefined); };
    const handleChange = (field: string, value: string) => { setFormData((p) => ({ ...p, [field]: value })); if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; }); };

    return (
        <WithFeature flag="library.enabled">
            <PageContent>
                <PageHeader title="Add Book" actions={<Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} />
                <Card>
                    <Form onSubmit={handleSubmit} isSubmitting={createMutation.isLoading}>
                        <FormSection title="Book Details">
                            <FormField name="title" label="Title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} error={errors.title} required />
                            <FormField name="author" label="Author" value={formData.author} onChange={(e) => handleChange('author', e.target.value)} error={errors.author} required />
                            <FormField name="isbn" label="ISBN" value={formData.isbn} onChange={(e) => handleChange('isbn', e.target.value)} />
                            <FormField name="totalCopies" label="Total Copies" type="number" value={formData.totalCopies} onChange={(e) => handleChange('totalCopies', e.target.value)} error={errors.totalCopies} required min={1} />
                            <FormField name="category" label="Category" value={formData.category} onChange={(e) => handleChange('category', e.target.value)} placeholder="e.g., Fiction, Science" />
                        </FormSection>
                        <FormActions>
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" isLoading={createMutation.isLoading}>Add Book</Button>
                        </FormActions>
                    </Form>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
