'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Save, Play, Lock, Megaphone } from 'lucide-react';
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
import { communicationClient, isApiError } from '@school-erp/api-client';

const AUDIENCES = ['all', 'students', 'staff', 'parents', 'teachers'];
const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'info'> = { draft: 'default', published: 'success', archived: 'info' };

export default function AnnouncementDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const confirm = useConfirm();
    const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
    const [formData, setFormData] = useState({ title: '', content: '', audience: 'all' });

    const { data: announcement, isLoading, isError, refetch } = useQuery(() => communicationClient.announcements.get(id));

    useEffect(() => { if (announcement) setFormData({ title: announcement.title, content: announcement.content ?? '', audience: announcement.audience ?? 'all' }); }, [announcement]);

    const isDraft = announcement?.status === 'draft';

    const updateMutation = useMutation(() => communicationClient.announcements.update(id, formData), {
        onSuccess: () => { toast.success('Updated'); setIsEditing(false); refetch(); },
        onError: (e) => toast.error(isApiError(e) ? e.message : 'Failed'),
    });

    const publishMutation = useMutation(() => communicationClient.announcements.publish(id), {
        onSuccess: () => { toast.success('Published'); refetch(); },
        onError: (e) => toast.error(isApiError(e) ? e.message : 'Failed'),
    });

    const handlePublish = async () => {
        if (await confirm({ title: 'Publish Announcement', message: 'Publish this announcement? This is irreversible.', confirmLabel: 'Publish', variant: 'default' })) publishMutation.mutate(undefined);
    };

    if (isLoading) return <PageLoader />;
    if (isError || !announcement) return <PageError onRetry={refetch} />;

    return (
        <WithFeature flag="communication.enabled">
            <PageContent>
                <PageHeader title={announcement.title} actions={
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        {isDraft && !isEditing && (
                            <>
                                <WithPermission permission="announcement:update:branch"><Button onClick={() => setIsEditing(true)}>Edit</Button></WithPermission>
                                <WithPermission permission="announcement:update:branch"><Button onClick={handlePublish} isLoading={publishMutation.isLoading}><Play className="mr-2 h-4 w-4" />Publish</Button></WithPermission>
                            </>
                        )}
                    </div>
                } />
                <Card>
                    <div className="flex items-center gap-4">
                        <Megaphone className="h-8 w-8 text-primary-500" />
                        <div><p className="text-sm text-gray-500">Status</p><Badge variant={STATUS_VARIANTS[announcement.status] ?? 'default'}>{announcement.status}</Badge></div>
                        {!isDraft && <span className="flex items-center gap-1 text-sm text-gray-500"><Lock className="h-3 w-3" />Read-only after publish</span>}
                    </div>
                </Card>
                <Card title="Details">
                    {isEditing && isDraft ? (
                        <Form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(undefined); }} isSubmitting={updateMutation.isLoading}>
                            <FormSection>
                                <FormField name="title" label="Title" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} required />
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Audience</label>
                                    <select value={formData.audience} onChange={(e) => setFormData((p) => ({ ...p, audience: e.target.value }))} className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none">
                                        {AUDIENCES.map((a) => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Content</label>
                                    <textarea value={formData.content} onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))} rows={6} className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none" />
                                </div>
                            </FormSection>
                            <FormActions>
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button type="submit" isLoading={updateMutation.isLoading}><Save className="mr-2 h-4 w-4" />Save</Button>
                            </FormActions>
                        </Form>
                    ) : (
                        <div className="space-y-4">
                            <div><p className="text-sm text-gray-500">Title</p><p className="font-medium">{announcement.title}</p></div>
                            <div><p className="text-sm text-gray-500">Audience</p><p className="font-medium capitalize">{announcement.audience}</p></div>
                            <div><p className="text-sm text-gray-500">Content</p><p className="whitespace-pre-wrap">{announcement.content}</p></div>
                            <div><p className="text-sm text-gray-500">Created</p><p className="font-medium">{new Date(announcement.createdAt).toLocaleString()}</p></div>
                        </div>
                    )}
                </Card>
            </PageContent>
        </WithFeature>
    );
}
