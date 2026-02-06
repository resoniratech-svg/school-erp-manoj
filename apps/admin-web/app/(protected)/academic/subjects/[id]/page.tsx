'use client';

/**
 * Subject Detail Page
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, BookOpen } from 'lucide-react';
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

const SUBJECT_TYPES = [
    { value: 'core', label: 'Core' },
    { value: 'elective', label: 'Elective' },
    { value: 'extra', label: 'Extra' },
];

const SUBJECT_TYPE_VARIANTS: Record<string, 'default' | 'success' | 'info' | 'warning'> = {
    core: 'success',
    elective: 'info',
    extra: 'warning',
};

export default function SubjectDetailPage() {
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
        code: '',
        type: 'core',
    });

    const { data: subject, isLoading, isError, refetch } = useQuery(
        () => academicClient.subjects.get(id)
    );

    useEffect(() => {
        if (subject) {
            setFormData({
                name: subject.name,
                code: subject.code ?? '',
                type: subject.type ?? 'core',
            });
        }
    }, [subject]);

    const updateMutation = useMutation(
        () =>
            academicClient.subjects.update(id, {
                name: formData.name,
                code: formData.code,
                type: formData.type as 'core' | 'elective' | 'extra',
            }),
        {
            onSuccess: () => {
                toast.success('Subject updated successfully');
                setIsEditing(false);
                refetch();
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to update subject');
                }
            },
        }
    );

    const deleteMutation = useMutation(
        () => academicClient.subjects.delete(params.id),
        {
            onSuccess: () => {
                toast.success('Subject deleted successfully');
                router.push('/academic/subjects');
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to delete subject');
                }
            },
        }
    );

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Delete Subject',
            message: `Are you sure you want to delete "${subject?.name}"? This action cannot be undone.`,
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

    if (isError || !subject) {
        return <PageError onRetry={refetch} />;
    }

    return (
        <WithFeature flag="academic.enabled">
            <PageContent>
                <PageHeader
                    title={subject.name}
                    subtitle="Subject details"
                    actions={
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            {!isEditing && (
                                <>
                                    <WithPermission permission="subject:update:tenant">
                                        <Button onClick={() => setIsEditing(true)}>Edit</Button>
                                    </WithPermission>
                                    <WithPermission permission="subject:delete:tenant">
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
                        <BookOpen className="h-8 w-8 text-primary-500" />
                        <div>
                            <p className="text-sm text-gray-500">Type</p>
                            <Badge variant={SUBJECT_TYPE_VARIANTS[subject.type ?? 'core']}>
                                {SUBJECT_TYPES.find((t) => t.value === subject.type)?.label ?? subject.type}
                            </Badge>
                        </div>
                    </div>
                </Card>

                {/* Details */}
                <Card title="Subject Details">
                    {isEditing ? (
                        <Form onSubmit={handleSubmit} isSubmitting={updateMutation.isLoading}>
                            <FormSection>
                                <FormField
                                    name="name"
                                    label="Subject Name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    required
                                />
                                <FormField
                                    name="code"
                                    label="Subject Code"
                                    value={formData.code}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, code: e.target.value }))
                                    }
                                />
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Subject Type
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, type: e.target.value }))
                                        }
                                        className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    >
                                        {SUBJECT_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
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
                                <p className="mt-1 text-gray-900">{subject.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Code</p>
                                <p className="mt-1 text-gray-900">{subject.code ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Type</p>
                                <p className="mt-1 text-gray-900">
                                    {SUBJECT_TYPES.find((t) => t.value === subject.type)?.label ?? subject.type}
                                </p>
                            </div>
                        </div>
                    )}
                </Card>
            </PageContent>
        </WithFeature>
    );
}
