'use client';

/**
 * Class Detail Page
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, GraduationCap } from 'lucide-react';
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

export default function ClassDetailPage() {
    const params = useParams();
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const confirm = useConfirm();
    const isEditMode = searchParams.get('edit') === 'true';

    const [isEditing, setIsEditing] = useState(isEditMode);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        grade: '',
    });

    const { data: classItem, isLoading, isError, refetch } = useQuery(
        () => academicClient.classes.get(id ?? '')
    );

    useEffect(() => {
        if (classItem) {
            setFormData({
                name: classItem.name,
                code: classItem.code ?? '',
                grade: String(classItem.grade ?? ''),
            });
        }
    }, [classItem]);

    const updateMutation = useMutation(
        () =>
            academicClient.classes.update(id ?? '', {
                name: formData.name,
                code: formData.code,
                grade: parseInt(formData.grade, 10),
            }),
        {
            onSuccess: () => {
                toast.success('Class updated successfully');
                setIsEditing(false);
                refetch();
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to update class');
                }
            },
        }
    );

    const deleteMutation = useMutation(
        () => academicClient.classes.delete(id ?? ''),
        {
            onSuccess: () => {
                toast.success('Class deleted successfully');
                router.push('/academic/classes');
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to delete class');
                }
            },
        }
    );

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Delete Class',
            message: `Are you sure you want to delete "${classItem?.name}"? This action cannot be undone.`,
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

    if (!id) return <PageError message="Invalid Class ID" />;

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError || !classItem) {
        return <PageError onRetry={refetch} />;
    }

    return (
        <WithFeature flag="academic.enabled">
            <PageContent>
                <PageHeader
                    title={classItem.name}
                    subtitle="Class details"
                    actions={
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            {!isEditing && (
                                <>
                                    <WithPermission permission="class:update:branch">
                                        <Button onClick={() => setIsEditing(true)}>Edit</Button>
                                    </WithPermission>
                                    <WithPermission permission="class:delete:branch">
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
                    <div className="flex items-center gap-4">
                        <GraduationCap className="h-8 w-8 text-primary-500" />
                        <div>
                            <p className="text-sm text-gray-500">Academic Year</p>
                            <p className="font-medium">{classItem.academicYear?.name ?? '—'}</p>
                        </div>
                        <Badge variant={classItem.status === 'active' ? 'success' : 'default'}>
                            {classItem.status}
                        </Badge>
                    </div>
                </Card>

                {/* Details */}
                <Card title="Class Details">
                    {isEditing ? (
                        <Form onSubmit={handleSubmit} isSubmitting={updateMutation.isLoading}>
                            <FormSection>
                                <FormField
                                    name="name"
                                    label="Class Name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    required
                                />
                                <FormField
                                    name="code"
                                    label="Class Code"
                                    value={formData.code}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, code: e.target.value }))
                                    }
                                />
                                <FormField
                                    name="grade"
                                    label="Grade Level"
                                    type="number"
                                    value={formData.grade}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, grade: e.target.value }))
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
                                <p className="mt-1 text-gray-900">{classItem.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Code</p>
                                <p className="mt-1 text-gray-900">{classItem.code ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Grade Level</p>
                                <p className="mt-1 text-gray-900">{classItem.grade ?? '—'}</p>
                            </div>
                        </div>
                    )}
                </Card>
            </PageContent>
        </WithFeature>
    );
}
