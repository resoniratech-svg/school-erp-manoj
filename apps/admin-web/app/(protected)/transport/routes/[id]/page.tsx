'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
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
import { transportClient, isApiError } from '@school-erp/api-client';

interface PageProps { params: { id: string }; }

export default function RouteDetailPage({ params }: PageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const confirm = useConfirm();
    const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
    const [formData, setFormData] = useState({ name: '', code: '', description: '' });

    const { data: route, isLoading, isError, refetch } = useQuery(() => transportClient.routes.get(params.id));

    useEffect(() => { if (route) setFormData({ name: route.name, code: route.code ?? '', description: route.description ?? '' }); }, [route]);

    const updateMutation = useMutation(() => transportClient.routes.update(params.id, formData), {
        onSuccess: () => { toast.success('Updated'); setIsEditing(false); refetch(); },
        onError: (e) => toast.error(isApiError(e) ? e.message : 'Failed'),
    });

    const deleteMutation = useMutation(() => transportClient.routes.delete(params.id), {
        onSuccess: () => { toast.success('Deleted'); router.push('/transport/routes'); },
        onError: (e) => toast.error(isApiError(e) ? e.message : 'Cannot delete'),
    });

    const handleDelete = async () => {
        if (await confirm({ title: 'Delete Route', message: 'Delete this route?', confirmLabel: 'Delete', variant: 'danger' })) deleteMutation.mutate(undefined);
    };

    if (isLoading) return <PageLoader />;
    if (isError || !route) return <PageError onRetry={refetch} />;

    return (
        <WithFeature flag="transport.enabled">
            <PageContent>
                <PageHeader title={route.name} actions={
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        {!isEditing && (
                            <>
                                <WithPermission permission="transport_route:update:branch"><Button onClick={() => setIsEditing(true)}>Edit</Button></WithPermission>
                                <WithPermission permission="transport_route:delete:branch"><Button variant="danger" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button></WithPermission>
                            </>
                        )}
                    </div>
                } />
                <Card><Badge variant={route.status === 'active' ? 'success' : 'default'}>{route.status}</Badge></Card>
                <Card title="Details">
                    {isEditing ? (
                        <Form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(undefined); }} isSubmitting={updateMutation.isLoading}>
                            <FormSection>
                                <FormField name="name" label="Name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} required />
                                <FormField name="code" label="Code" value={formData.code} onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))} />
                            </FormSection>
                            <FormActions>
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button type="submit" isLoading={updateMutation.isLoading}><Save className="mr-2 h-4 w-4" />Save</Button>
                            </FormActions>
                        </Form>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{route.name}</p></div>
                            <div><p className="text-sm text-gray-500">Code</p><p className="font-medium">{route.code}</p></div>
                        </div>
                    )}
                </Card>
            </PageContent>
        </WithFeature>
    );
}
