'use client';

/**
 * Fee Structure Detail Page
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, FileText } from 'lucide-react';
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
import { feesClient, isApiError } from '@school-erp/api-client';

const FEE_TYPES = [
    { value: 'tuition', label: 'Tuition' },
    { value: 'transport', label: 'Transport' },
    { value: 'library', label: 'Library' },
    { value: 'lab', label: 'Laboratory' },
    { value: 'sports', label: 'Sports' },
    { value: 'exam', label: 'Examination' },
    { value: 'other', label: 'Other' },
];

interface PageProps {
    params: { id: string };
}

export default function FeeStructureDetailPage({ params }: PageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const confirm = useConfirm();
    const isEditMode = searchParams.get('edit') === 'true';

    const [isEditing, setIsEditing] = useState(isEditMode);
    const [formData, setFormData] = useState({
        name: '',
        type: 'tuition',
        amount: '',
        description: '',
    });

    const { data: structure, isLoading, isError, refetch } = useQuery(
        () => feesClient.structures.get(params.id)
    );

    useEffect(() => {
        if (structure) {
            setFormData({
                name: structure.name,
                type: structure.type ?? 'tuition',
                amount: String(structure.amount),
                description: structure.description ?? '',
            });
        }
    }, [structure]);

    const updateMutation = useMutation(
        () =>
            feesClient.structures.update(params.id, {
                name: formData.name,
                type: formData.type,
                amount: parseFloat(formData.amount),
                description: formData.description || undefined,
            }),
        {
            onSuccess: () => {
                toast.success('Fee structure updated successfully');
                setIsEditing(false);
                refetch();
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to update fee structure');
                }
            },
        }
    );

    const deleteMutation = useMutation(
        () => feesClient.structures.delete(params.id),
        {
            onSuccess: () => {
                toast.success('Fee structure deleted successfully');
                router.push('/fees/structures');
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Cannot delete: fee structure has existing assignments');
                }
            },
        }
    );

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Delete Fee Structure',
            message: `Are you sure you want to delete "${structure?.name}"? This will fail if the structure has existing fee assignments.`,
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError || !structure) {
        return <PageError onRetry={refetch} />;
    }

    return (
        <WithFeature flag="fees.enabled">
            <PageContent>
                <PageHeader
                    title={structure.name}
                    subtitle="Fee structure details"
                    actions={
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            {!isEditing && (
                                <>
                                    <WithPermission permission="fee_structure:update:tenant">
                                        <Button onClick={() => setIsEditing(true)}>Edit</Button>
                                    </WithPermission>
                                    <WithPermission permission="fee_structure:delete:tenant">
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

                {/* Summary Card */}
                <Card>
                    <div className="flex items-center gap-6">
                        <FileText className="h-10 w-10 text-primary-500" />
                        <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(structure.amount)}
                            </p>
                        </div>
                        <Badge variant={structure.status === 'active' ? 'success' : 'default'}>
                            {structure.status}
                        </Badge>
                    </div>
                </Card>

                {/* Details */}
                <Card title="Structure Details">
                    {isEditing ? (
                        <Form onSubmit={handleSubmit} isSubmitting={updateMutation.isLoading}>
                            <FormSection>
                                <FormField
                                    name="name"
                                    label="Fee Name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    required
                                />
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Fee Type
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, type: e.target.value }))
                                        }
                                        className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    >
                                        {FEE_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <FormField
                                    name="amount"
                                    label="Amount (₹)"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, amount: e.target.value }))
                                    }
                                    required
                                    min={0}
                                    step={0.01}
                                />
                                <FormField
                                    name="description"
                                    label="Description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, description: e.target.value }))
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
                                <p className="mt-1 text-gray-900">{structure.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Type</p>
                                <p className="mt-1 text-gray-900">
                                    {FEE_TYPES.find((t) => t.value === structure.type)?.label ?? structure.type}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Amount</p>
                                <p className="mt-1 text-gray-900">{formatCurrency(structure.amount)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Description</p>
                                <p className="mt-1 text-gray-900">{structure.description ?? '—'}</p>
                            </div>
                        </div>
                    )}
                </Card>
            </PageContent>
        </WithFeature>
    );
}
