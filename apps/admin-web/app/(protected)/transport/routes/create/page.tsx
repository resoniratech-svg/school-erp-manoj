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
import { transportClient, isApiError } from '@school-erp/api-client';

export default function CreateRoutePage() {
    const router = useRouter();
    const toast = useToast();
    const [formData, setFormData] = useState({ name: '', code: '', description: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useMutation(
        () => transportClient.routes.create({ name: formData.name, code: formData.code, description: formData.description || undefined }),
        {
            onSuccess: (route) => { toast.success('Route created'); router.push(`/transport/routes/${route.id}`); },
            onError: (error) => { toast.error(isApiError(error) ? error.message : 'Failed to create'); },
        }
    );

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.name.trim()) e.name = 'Required';
        if (!formData.code.trim()) e.code = 'Required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) createMutation.mutate(undefined); };
    const handleChange = (field: string, value: string) => { setFormData((p) => ({ ...p, [field]: value })); if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; }); };

    return (
        <WithFeature flag="transport.enabled">
            <PageContent>
                <PageHeader title="Create Route" actions={<Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} />
                <Card>
                    <Form onSubmit={handleSubmit} isSubmitting={createMutation.isLoading}>
                        <FormSection title="Route Details">
                            <FormField name="name" label="Route Name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} error={errors.name} required placeholder="e.g., North Route" />
                            <FormField name="code" label="Code" value={formData.code} onChange={(e) => handleChange('code', e.target.value)} error={errors.code} required placeholder="e.g., RT-N01" />
                            <FormField name="description" label="Description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
                        </FormSection>
                        <FormActions>
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" isLoading={createMutation.isLoading}>Create</Button>
                        </FormActions>
                    </Form>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
