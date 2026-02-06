'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Bus } from 'lucide-react';
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

export default function VehicleDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const confirm = useConfirm();
    const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
    const [formData, setFormData] = useState({ registrationNumber: '', model: '', capacity: '' });

    const { data: vehicle, isLoading, isError, refetch } = useQuery(() => transportClient.vehicles.get(id));

    useEffect(() => { if (vehicle) setFormData({ registrationNumber: vehicle.registrationNumber, model: vehicle.model ?? '', capacity: String(vehicle.capacity) }); }, [vehicle]);

    const updateMutation = useMutation(() => transportClient.vehicles.update(id, { registrationNumber: formData.registrationNumber, model: formData.model, capacity: parseInt(formData.capacity, 10) }), {
        onSuccess: () => { toast.success('Updated'); setIsEditing(false); refetch(); },
        onError: (e) => toast.error(isApiError(e) ? e.message : 'Failed'),
    });

    const deleteMutation = useMutation(() => transportClient.vehicles.delete(id), {
        onSuccess: () => { toast.success('Deleted'); router.push('/transport/vehicles'); },
        onError: (e) => toast.error(isApiError(e) ? e.message : 'Cannot delete'),
    });

    const handleDelete = async () => { if (await confirm({ title: 'Delete Vehicle', message: 'Delete this vehicle?', confirmLabel: 'Delete', variant: 'danger' })) deleteMutation.mutate(undefined); };

    if (isLoading) return <PageLoader />;
    if (isError || !vehicle) return <PageError onRetry={refetch} />;

    const pct = vehicle.capacity ? ((vehicle.currentOccupancy ?? 0) / vehicle.capacity) * 100 : 0;

    return (
        <WithFeature flag="transport.enabled">
            <PageContent>
                <PageHeader title={vehicle.registrationNumber} actions={
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        {!isEditing && (
                            <>
                                <WithPermission permission="vehicle:update:branch"><Button onClick={() => setIsEditing(true)}>Edit</Button></WithPermission>
                                <WithPermission permission="vehicle:delete:branch"><Button variant="danger" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button></WithPermission>
                            </>
                        )}
                    </div>
                } />
                <Card>
                    <div className="flex items-center gap-4">
                        <Bus className="h-8 w-8 text-primary-500" />
                        <div>
                            <p className="text-sm text-gray-500">Occupancy</p>
                            <p className="text-xl font-bold">{vehicle.currentOccupancy ?? 0} / {vehicle.capacity}</p>
                        </div>
                        <Badge variant={pct >= 90 ? 'error' : pct >= 70 ? 'warning' : 'success'}>{Math.round(pct)}% full</Badge>
                    </div>
                </Card>
                <Card title="Details">
                    {isEditing ? (
                        <Form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(undefined); }} isSubmitting={updateMutation.isLoading}>
                            <FormSection>
                                <FormField name="registrationNumber" label="Registration" value={formData.registrationNumber} onChange={(e) => setFormData((p) => ({ ...p, registrationNumber: e.target.value }))} required />
                                <FormField name="model" label="Model" value={formData.model} onChange={(e) => setFormData((p) => ({ ...p, model: e.target.value }))} />
                                <FormField name="capacity" label="Capacity" type="number" value={formData.capacity} onChange={(e) => setFormData((p) => ({ ...p, capacity: e.target.value }))} required min={1} />
                            </FormSection>
                            <FormActions>
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button type="submit" isLoading={updateMutation.isLoading}><Save className="mr-2 h-4 w-4" />Save</Button>
                            </FormActions>
                        </Form>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div><p className="text-sm text-gray-500">Registration</p><p className="font-medium">{vehicle.registrationNumber}</p></div>
                            <div><p className="text-sm text-gray-500">Model</p><p className="font-medium">{vehicle.model ?? '—'}</p></div>
                            <div><p className="text-sm text-gray-500">Route</p><p className="font-medium">{vehicle.route?.name ?? '—'}</p></div>
                        </div>
                    )}
                </Card>
            </PageContent>
        </WithFeature>
    );
}
