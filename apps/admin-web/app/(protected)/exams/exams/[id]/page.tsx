'use client';

/**
 * Exam Detail Page
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Play, Lock, FileText } from 'lucide-react';
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
import { examsClient, isApiError } from '@school-erp/api-client';

const EXAM_TYPES = [
    { value: 'unit_test', label: 'Unit Test' },
    { value: 'mid_term', label: 'Mid Term' },
    { value: 'final', label: 'Final Exam' },
    { value: 'practical', label: 'Practical' },
    { value: 'assignment', label: 'Assignment' },
];

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
    draft: 'default',
    scheduled: 'warning',
    published: 'success',
    completed: 'info',
};

interface PageProps {
    params: { id: string };
}

export default function ExamDetailPage({ params }: PageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const confirm = useConfirm();
    const isEditMode = searchParams.get('edit') === 'true';

    const [isEditing, setIsEditing] = useState(isEditMode);
    const [formData, setFormData] = useState({
        name: '',
        type: 'unit_test',
        startDate: '',
        endDate: '',
        description: '',
    });

    const { data: exam, isLoading, isError, refetch } = useQuery(
        () => examsClient.get(params.id)
    );

    useEffect(() => {
        if (exam) {
            setFormData({
                name: exam.name,
                type: exam.type ?? 'unit_test',
                startDate: exam.startDate?.split('T')[0] ?? '',
                endDate: exam.endDate?.split('T')[0] ?? '',
                description: exam.description ?? '',
            });
        }
    }, [exam]);

    const isDraft = exam?.status === 'draft';

    const updateMutation = useMutation(
        () =>
            examsClient.update(params.id, {
                name: formData.name,
                type: formData.type,
                startDate: formData.startDate,
                endDate: formData.endDate,
                description: formData.description || undefined,
            }),
        {
            onSuccess: () => {
                toast.success('Exam updated');
                setIsEditing(false);
                refetch();
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to update');
                }
            },
        }
    );

    const publishMutation = useMutation(
        () => examsClient.publish(params.id),
        {
            onSuccess: () => {
                toast.success('Exam published');
                refetch();
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to publish');
                }
            },
        }
    );

    const deleteMutation = useMutation(
        () => examsClient.delete(params.id),
        {
            onSuccess: () => {
                toast.success('Exam deleted');
                router.push('/exams/exams');
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to delete');
                }
            },
        }
    );

    const handlePublish = async () => {
        const confirmed = await confirm({
            title: 'Publish Exam',
            message: `Publish "${exam?.name}"? After publishing, the exam cannot be edited or deleted.`,
            confirmLabel: 'Publish',
            variant: 'default',
        });

        if (confirmed) {
            publishMutation.mutate(undefined);
        }
    };

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Delete Exam',
            message: `Delete "${exam?.name}"? This cannot be undone.`,
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

    if (isError || !exam) {
        return <PageError onRetry={refetch} />;
    }

    return (
        <WithFeature flag="exams.enabled">
            <PageContent>
                <PageHeader
                    title={exam.name}
                    subtitle="Exam details"
                    actions={
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            {isDraft && !isEditing && (
                                <>
                                    <WithPermission permission="exam:update:branch">
                                        <Button onClick={() => setIsEditing(true)}>Edit</Button>
                                    </WithPermission>
                                    <WithPermission permission="exam:update:branch">
                                        <Button
                                            variant="outline"
                                            onClick={handlePublish}
                                            isLoading={publishMutation.isLoading}
                                        >
                                            <Play className="mr-2 h-4 w-4" />
                                            Publish
                                        </Button>
                                    </WithPermission>
                                    <WithPermission permission="exam:delete:branch">
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

                {/* Status Card */}
                <Card>
                    <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-primary-500" />
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <div className="flex items-center gap-2">
                                <Badge variant={STATUS_VARIANTS[exam.status] ?? 'default'}>
                                    {exam.status}
                                </Badge>
                                {!isDraft && (
                                    <span className="flex items-center gap-1 text-sm text-gray-500">
                                        <Lock className="h-3 w-3" />
                                        Read-only
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Details */}
                <Card title="Exam Details">
                    {isEditing && isDraft ? (
                        <Form onSubmit={handleSubmit} isSubmitting={updateMutation.isLoading}>
                            <FormSection>
                                <FormField
                                    name="name"
                                    label="Exam Name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    required
                                />
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Exam Type
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, type: e.target.value }))
                                        }
                                        className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
                                    >
                                        {EXAM_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
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
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={updateMutation.isLoading}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save
                                </Button>
                            </FormActions>
                        </Form>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-medium">{exam.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Type</p>
                                <p className="font-medium">
                                    {EXAM_TYPES.find((t) => t.value === exam.type)?.label ?? exam.type}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Start Date</p>
                                <p className="font-medium">
                                    {new Date(exam.startDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">End Date</p>
                                <p className="font-medium">
                                    {new Date(exam.endDate).toLocaleDateString()}
                                </p>
                            </div>
                            {exam.description && (
                                <div className="md:col-span-2">
                                    <p className="text-sm text-gray-500">Description</p>
                                    <p className="font-medium">{exam.description}</p>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </PageContent>
        </WithFeature>
    );
}
