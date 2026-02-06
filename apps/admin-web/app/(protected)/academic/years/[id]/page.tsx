'use client';

/**
 * Academic Year Detail Page
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Save, Play, Calendar } from 'lucide-react';
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
import { academicClient, isApiError } from '@school-erp/api-client';

export default function AcademicYearDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const confirm = useConfirm();
    const isEditMode = searchParams.get('edit') === 'true';

    const [isEditing, setIsEditing] = useState(isEditMode);
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
    });

    const { data: year, isLoading, isError, refetch } = useQuery(
        () => academicClient.years.get(params.id)
    );

    useEffect(() => {
        if (year) {
            setFormData({
                name: year.name,
                startDate: new Date(year.startDate).toISOString().split('T')[0],
                endDate: new Date(year.endDate).toISOString().split('T')[0],
            });
        }
    }, [year]);

    const updateMutation = useMutation(
        () =>
            academicClient.years.update(id, {
                name: formData.name,
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
            }),
        {
            onSuccess: () => {
                toast.success('Academic year updated successfully');
                setIsEditing(false);
                refetch();
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to update academic year');
                }
            },
        }
    );

    const activateMutation = useMutation(
        () => academicClient.years.activate(id),
        {
            onSuccess: () => {
                toast.success('Academic year activated successfully');
                refetch();
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to activate academic year');
                }
            },
        }
    );

    const handleActivate = async () => {
        const confirmed = await confirm({
            title: 'Activate Academic Year',
            message: `Are you sure you want to set "${year?.name}" as the current academic year?`,
            confirmLabel: 'Activate',
            variant: 'default',
        });

        if (confirmed) {
            activateMutation.mutate(undefined);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(undefined);
    };

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError || !year) {
        return <PageError onRetry={refetch} />;
    }

    const isCurrent = year.isCurrent;

    return (
        <WithFeature flag="academic.enabled">
            <PageContent>
                <PageHeader
                    title={year.name}
                    subtitle="Academic year details"
                    actions={
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            {!isCurrent && !isEditing && (
                                <>
                                    <WithPermission permission="academic_year:activate:tenant">
                                        <Button
                                            variant="outline"
                                            onClick={handleActivate}
                                            isLoading={activateMutation.isLoading}
                                        >
                                            <Play className="mr-2 h-4 w-4" />
                                            Activate
                                        </Button>
                                    </WithPermission>
                                    <WithPermission permission="academic_year:update:tenant">
                                        <Button onClick={() => setIsEditing(true)}>Edit</Button>
                                    </WithPermission>
                                </>
                            )}
                        </div>
                    }
                />

                {/* Status Card */}
                <Card>
                    <div className="flex items-center gap-4">
                        <Calendar className="h-8 w-8 text-primary-500" />
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <div className="flex items-center gap-2">
                                <Badge variant={year.isActive ? 'success' : 'default'}>
                                    {year.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                {isCurrent && <Badge variant="info">Current Year</Badge>}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Details */}
                <Card title="Year Details">
                    {isEditing && !isCurrent ? (
                        <Form onSubmit={handleSubmit} isSubmitting={updateMutation.isLoading}>
                            <FormSection>
                                <FormField
                                    name="name"
                                    label="Year Name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    required
                                />
                                <div />
                                <FormField
                                    name="startDate"
                                    label="Start Date"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                                    }
                                    required
                                />
                                <FormField
                                    name="endDate"
                                    label="End Date"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                                    }
                                    required
                                />
                            </FormSection>

                            <FormActions>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={updateMutation.isLoading}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </FormActions>
                        </Form>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Name</p>
                                <p className="mt-1 text-gray-900">{year.name}</p>
                            </div>
                            <div />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Start Date</p>
                                <p className="mt-1 text-gray-900">
                                    {new Date(year.startDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">End Date</p>
                                <p className="mt-1 text-gray-900">
                                    {new Date(year.endDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}
                </Card>
            </PageContent>
        </WithFeature>
    );
}
