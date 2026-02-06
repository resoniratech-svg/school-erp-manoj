'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Form, FormSection, FormActions } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { WithFeature } from '@/components/auth/WithFeature';
import { useMutation, useQuery } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { libraryClient, isApiError } from '@school-erp/api-client';

export default function IssueBookPage() {
    const router = useRouter();
    const toast = useToast();
    const [formData, setFormData] = useState({ bookId: '', borrowerId: '', borrowerType: 'student', dueDate: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: booksData } = useQuery(() => libraryClient.books.list({ limit: 100 }));
    const books = (booksData?.data ?? []).filter((b: { availableCopies?: number }) => (b.availableCopies ?? 0) > 0);

    const { data: borrowersData } = useQuery(() => libraryClient.issues.getBorrowers({ type: formData.borrowerType, limit: 100 }));
    const borrowers = borrowersData?.data ?? [];

    const createMutation = useMutation(
        () => libraryClient.issues.create({ bookId: formData.bookId, borrowerId: formData.borrowerId, borrowerType: formData.borrowerType, dueDate: formData.dueDate }),
        {
            onSuccess: () => { toast.success('Book issued'); router.push('/library/issues'); },
            onError: (e) => toast.error(isApiError(e) ? e.message : 'Failed'),
        }
    );

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.bookId) e.bookId = 'Required';
        if (!formData.borrowerId) e.borrowerId = 'Required';
        if (!formData.dueDate) e.dueDate = 'Required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) createMutation.mutate(undefined); };

    return (
        <WithFeature flag="library.enabled">
            <PageContent>
                <PageHeader title="Issue Book" actions={<Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} />
                <Card>
                    <Form onSubmit={handleSubmit} isSubmitting={createMutation.isLoading}>
                        <FormSection title="Issue Details">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Book <span className="text-red-500">*</span></label>
                                <select value={formData.bookId} onChange={(e) => setFormData((p) => ({ ...p, bookId: e.target.value }))} className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none">
                                    <option value="">Select book</option>
                                    {books.map((b: { id: string; title: string; availableCopies?: number }) => <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} available)</option>)}
                                </select>
                                {errors.bookId && <p className="mt-1 text-sm text-red-500">{errors.bookId}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Borrower Type</label>
                                <select value={formData.borrowerType} onChange={(e) => setFormData((p) => ({ ...p, borrowerType: e.target.value, borrowerId: '' }))} className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none">
                                    <option value="student">Student</option>
                                    <option value="staff">Staff</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Borrower <span className="text-red-500">*</span></label>
                                <select value={formData.borrowerId} onChange={(e) => setFormData((p) => ({ ...p, borrowerId: e.target.value }))} className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none">
                                    <option value="">Select {formData.borrowerType}</option>
                                    {borrowers.map((b: { id: string; name: string }) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                {errors.borrowerId && <p className="mt-1 text-sm text-red-500">{errors.borrowerId}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Due Date <span className="text-red-500">*</span></label>
                                <input type="date" value={formData.dueDate} onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))} min={new Date().toISOString().split('T')[0]} className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none" />
                                {errors.dueDate && <p className="mt-1 text-sm text-red-500">{errors.dueDate}</p>}
                            </div>
                        </FormSection>
                        <FormActions>
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" isLoading={createMutation.isLoading}>Issue Book</Button>
                        </FormActions>
                    </Form>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
