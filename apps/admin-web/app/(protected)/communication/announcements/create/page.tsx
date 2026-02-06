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
import { communicationClient, isApiError } from '@school-erp/api-client';

const AUDIENCES = ['all', 'students', 'staff', 'parents', 'teachers'];

export default function CreateAnnouncementPage() {
    const router = useRouter();
    const toast = useToast();
    const [formData, setFormData] = useState({ title: '', content: '', audience: 'all' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useMutation(
        () => communicationClient.announcements.create({ title: formData.title, content: formData.content, audience: formData.audience }),
        {
            onSuccess: (a) => { toast.success('Draft created'); router.push(`/communication/announcements/${a.id}`); },
            onError: (e) => toast.error(isApiError(e) ? e.message : 'Failed'),
        }
    );

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.title.trim()) e.title = 'Required';
        if (!formData.content.trim()) e.content = 'Required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) createMutation.mutate(undefined); };
    const handleChange = (field: string, value: string) => { setFormData((p) => ({ ...p, [field]: value })); if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; }); };

    return (
        <WithFeature flag="communication.enabled">
            <PageContent>
                <PageHeader title="Create Announcement" subtitle="Draft will be saved, publish when ready" actions={<Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} />
                <Card>
                    <Form onSubmit={handleSubmit} isSubmitting={createMutation.isLoading}>
                        <FormSection title="Announcement Details">
                            <FormField name="title" label="Title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} error={errors.title} required placeholder="Announcement title" />
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Audience</label>
                                <select value={formData.audience} onChange={(e) => handleChange('audience', e.target.value)} className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none">
                                    {AUDIENCES.map((a) => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">Content <span className="text-red-500">*</span></label>
                                <textarea value={formData.content} onChange={(e) => handleChange('content', e.target.value)} rows={6} className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none" placeholder="Announcement content..." />
                                {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
                            </div>
                        </FormSection>
                        <FormActions>
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" isLoading={createMutation.isLoading}>Save as Draft</Button>
                        </FormActions>
                    </Form>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
