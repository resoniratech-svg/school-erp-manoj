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
import { transportClient, isApiError } from '@school-erp/api-client';

export default function CreateAssignmentPage() {
    const router = useRouter();
    const toast = useToast();
    const [formData, setFormData] = useState({ studentId: '', routeId: '', stopId: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: routesData } = useQuery(() => transportClient.routes.list({ limit: 100 }));
    const routes = routesData?.data ?? [];

    const selectedRoute = routes.find((r) => r.id === formData.routeId);
    const stops = selectedRoute?.stops ?? [];

    const { data: studentsData } = useQuery(() => transportClient.assignments.getUnassignedStudents({ limit: 100 }));
    const students = studentsData?.data ?? [];

    const createMutation = useMutation(
        () => transportClient.assignments.create({ studentId: formData.studentId, routeId: formData.routeId, stopId: formData.stopId || undefined }),
        {
            onSuccess: (a) => { toast.success('Student assigned'); router.push(`/transport/assignments/${a.id}`); },
            onError: (e) => toast.error(isApiError(e) ? e.message : 'Failed to assign'),
        }
    );

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.studentId) e.studentId = 'Required';
        if (!formData.routeId) e.routeId = 'Required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) createMutation.mutate(undefined); };

    return (
        <WithFeature flag="transport.enabled">
            <PageContent>
                <PageHeader title="Assign Student" actions={<Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} />
                <Card>
                    <Form onSubmit={handleSubmit} isSubmitting={createMutation.isLoading}>
                        <FormSection title="Assignment Details">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Student <span className="text-red-500">*</span></label>
                                <select value={formData.studentId} onChange={(e) => setFormData((p) => ({ ...p, studentId: e.target.value }))} className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none">
                                    <option value="">Select student</option>
                                    {students.map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                {errors.studentId && <p className="mt-1 text-sm text-red-500">{errors.studentId}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Route <span className="text-red-500">*</span></label>
                                <select value={formData.routeId} onChange={(e) => setFormData((p) => ({ ...p, routeId: e.target.value, stopId: '' }))} className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none">
                                    <option value="">Select route</option>
                                    {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                                {errors.routeId && <p className="mt-1 text-sm text-red-500">{errors.routeId}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Stop</label>
                                <select value={formData.stopId} onChange={(e) => setFormData((p) => ({ ...p, stopId: e.target.value }))} disabled={!formData.routeId} className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none disabled:bg-gray-100">
                                    <option value="">Select stop</option>
                                    {stops.map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </FormSection>
                        <FormActions>
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" isLoading={createMutation.isLoading}>Assign</Button>
                        </FormActions>
                    </Form>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
