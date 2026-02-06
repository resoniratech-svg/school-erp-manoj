'use client';

/**
 * Section Detail Page
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Users, UserPlus } from 'lucide-react';
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

interface PageProps {
    params: { id: string };
}

export default function SectionDetailPage({ params }: PageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const confirm = useConfirm();
    const isEditMode = searchParams.get('edit') === 'true';

    const [isEditing, setIsEditing] = useState(isEditMode);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        capacity: '',
    });

    const { data: section, isLoading, isError, refetch } = useQuery(
        () => academicClient.sections.get(params.id)
    );

    useEffect(() => {
        if (section) {
            setFormData({
                name: section.name,
                code: section.code ?? '',
                capacity: String(section.capacity ?? ''),
            });
        }
    }, [section]);

    const updateMutation = useMutation(
        () =>
            academicClient.sections.update(params.id, {
                name: formData.name,
                code: formData.code,
                capacity: parseInt(formData.capacity, 10) || undefined,
            }),
        {
            onSuccess: () => {
                toast.success('Section updated successfully');
                setIsEditing(false);
                refetch();
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to update section');
                }
            },
        }
    );

    const deleteMutation = useMutation(
        () => academicClient.sections.delete(params.id),
        {
            onSuccess: () => {
                toast.success('Section deleted successfully');
                router.push('/academic/sections');
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to delete section');
                }
            },
        }
    );

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Delete Section',
            message: `Are you sure you want to delete "${section?.name}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });

        if (confirmed) {
            deleteMutation.mutate(undefined);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(undefined);
    };

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError || !section) {
        return <PageError onRetry={refetch} />;
    }

    return (
        <WithFeature flag="academic.enabled">
            <PageContent>
                <PageHeader
                    title={section.name}
                    subtitle={`Class: ${section.class?.name ?? '—'}`}
                    actions={
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            {!isEditing && (
                                <>
                                    <WithPermission permission="section:update:branch">
                                        <Button onClick={() => setIsEditing(true)}>Edit</Button>
                                    </WithPermission>
                                    <WithPermission permission="section:delete:branch">
                                        <Button
                                            variant="danger"
                                            onClick={handleDelete}
                                            isLoading={deleteMutation.isLoading}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </Button>
                                    </WithPermission>
                                </>
                            )}
                        </div>
                    }
                />

                {/* Info Card */}
                <Card>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-primary-500" />
                            <div>
                                <p className="text-sm text-gray-500">Capacity</p>
                                <p className="font-medium">{section.capacity ?? 'Unlimited'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Class Teacher</p>
                            <p className="font-medium">
                                {section.classTeacher?.name ?? (
                                    <span className="text-gray-400">Not assigned</span>
                                )}
                            </p>
                        </div>
                        <Badge variant={section.status === 'active' ? 'success' : 'default'}>
                            {section.status}
                        </Badge>
                    </div>
                </Card>

                {/* Details */}
                <Card title="Section Details">
                    {isEditing ? (
                        <Form onSubmit={handleSubmit} isSubmitting={updateMutation.isLoading}>
                            <FormSection>
                                <FormField
                                    name="name"
                                    label="Section Name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    required
                                />
                                <FormField
                                    name="code"
                                    label="Section Code"
                                    value={formData.code}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, code: e.target.value }))
                                    }
                                />
                                <FormField
                                    name="capacity"
                                    label="Capacity"
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, capacity: e.target.value }))
                                    }
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
                                <p className="mt-1 text-gray-900">{section.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Code</p>
                                <p className="mt-1 text-gray-900">{section.code ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Class</p>
                                <p className="mt-1 text-gray-900">{section.class?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Capacity</p>
                                <p className="mt-1 text-gray-900">{section.capacity ?? 'Unlimited'}</p>
                            </div>
                        </div>
                    )}
                </Card>
            </PageContent>
        </WithFeature>
    );
}
