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
import { useMutation, useQuery } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { transportClient, isApiError } from '@school-erp/api-client';

export default function CreateVehiclePage() {
    const router = useRouter();
    const toast = useToast();
    const [formData, setFormData] = useState({ registrationNumber: '', model: '', capacity: '40', routeId: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: routesData } = useQuery(() => transportClient.routes.list({ limit: 100 }));
    const routes = routesData?.data ?? [];

    const createMutation = useMutation(
        () => transportClient.vehicles.create({ registrationNumber: formData.registrationNumber, model: formData.model, capacity: parseInt(formData.capacity, 10), routeId: formData.routeId || undefined }),
        {
            onSuccess: (v) => { toast.success('Vehicle created'); router.push(`/transport/vehicles/${v.id}`); },
            onError: (e) => toast.error(isApiError(e) ? e.message : 'Failed'),
        }
    );

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.registrationNumber.trim()) e.registrationNumber = 'Required';
        if (!formData.capacity || parseInt(formData.capacity, 10) <= 0) e.capacity = 'Must be > 0';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) createMutation.mutate(undefined); };
    const handleChange = (field: string, value: string) => { setFormData((p) => ({ ...p, [field]: value })); if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; }); };

    return (
        <WithFeature flag="transport.enabled">
            <PageContent>
                <PageHeader title="Add Vehicle" actions={<Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} />
                <Card>
                    <Form onSubmit={handleSubmit} isSubmitting={createMutation.isLoading}>
                        <FormSection title="Vehicle Details">
                            <FormField name="registrationNumber" label="Registration Number" value={formData.registrationNumber} onChange={(e) => handleChange('registrationNumber', e.target.value)} error={errors.registrationNumber} required placeholder="e.g., KA-01-AB-1234" />
                            <FormField name="model" label="Model" value={formData.model} onChange={(e) => handleChange('model', e.target.value)} placeholder="e.g., Tata Starbus" />
                            <FormField name="capacity" label="Capacity" type="number" value={formData.capacity} onChange={(e) => handleChange('capacity', e.target.value)} error={errors.capacity} required min={1} />
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Route</label>
                                <select value={formData.routeId} onChange={(e) => handleChange('routeId', e.target.value)} className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none">
                                    <option value="">Select route</option>
                                    {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
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
