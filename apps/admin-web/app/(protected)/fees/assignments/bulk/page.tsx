'use client';

/**
 * Bulk Fee Assignment Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Users, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Form, FormSection, FormActions } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { WithFeature } from '@/components/auth/WithFeature';
import { useMutation, useQuery } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { feesClient, academicClient, isApiError } from '@school-erp/api-client';

export default function BulkAssignPage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();

    const [formData, setFormData] = useState({
        feeStructureId: '',
        classId: '',
        sectionId: '',
    });
    const [previewCount, setPreviewCount] = useState<number | null>(null);

    const { data: structuresData } = useQuery(() => feesClient.structures.list({ limit: 100 }));
    const structures = structuresData?.data ?? [];

    const { data: classesData } = useQuery(() => academicClient.classes.list({ limit: 100 }));
    const classes = classesData?.data ?? [];

    const { data: sectionsData } = useQuery(
        () => academicClient.sections.list({ classId: formData.classId, limit: 100 }),
        { enabled: !!formData.classId }
    );
    const sections = sectionsData?.data ?? [];

    const selectedStructure = structures.find((s) => s.id === formData.feeStructureId);

    const previewMutation = useMutation(
        () =>
            feesClient.assignments.preview({
                feeStructureId: formData.feeStructureId,
                classId: formData.classId,
                sectionId: formData.sectionId || undefined,
            }),
        {
            onSuccess: (result) => {
                setPreviewCount(result.count);
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to preview');
            },
        }
    );

    const assignMutation = useMutation(
        () =>
            feesClient.assignments.bulkCreate({
                feeStructureId: formData.feeStructureId,
                classId: formData.classId,
                sectionId: formData.sectionId || undefined,
            }),
        {
            onSuccess: (result) => {
                toast.success(`Fee assigned to ${result.count} students successfully`);
                router.push('/fees/assignments');
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to assign fees');
                }
            },
        }
    );

    const handlePreview = () => {
        if (formData.feeStructureId && formData.classId) {
            previewMutation.mutate(undefined);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (previewCount === null) {
            toast.error('Please preview first to see affected students');
            return;
        }

        if (previewCount === 0) {
            toast.error('No students found for this selection');
            return;
        }

        const confirmed = await confirm({
            title: 'Confirm Bulk Assignment',
            message: `You are about to assign "${selectedStructure?.name}" fee to ${previewCount} students. This action cannot be undone.`,
            confirmLabel: 'Assign Fees',
            variant: 'default',
        });

        if (confirmed) {
            assignMutation.mutate(undefined);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <WithFeature flag="fees.enabled">
            <PageContent>
                <PageHeader
                    title="Bulk Fee Assignment"
                    subtitle="Assign fees to multiple students at once"
                    actions={
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    }
                />

                {/* Warning Card */}
                <Card className="border-amber-200 bg-amber-50">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <div>
                            <p className="font-medium text-amber-800">Important</p>
                            <p className="mt-1 text-sm text-amber-700">
                                Bulk assignment will create fee records for all students in the selected class/section.
                                Please review the preview before confirming.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <Form onSubmit={handleSubmit} isSubmitting={assignMutation.isLoading}>
                        <FormSection title="Selection">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Fee Structure <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.feeStructureId}
                                    onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, feeStructureId: e.target.value }));
                                        setPreviewCount(null);
                                    }}
                                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                >
                                    <option value="">Select fee structure</option>
                                    {structures.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({formatCurrency(s.amount)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Class <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.classId}
                                    onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, classId: e.target.value, sectionId: '' }));
                                        setPreviewCount(null);
                                    }}
                                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                >
                                    <option value="">Select class</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Section (Optional)
                                </label>
                                <select
                                    value={formData.sectionId}
                                    onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, sectionId: e.target.value }));
                                        setPreviewCount(null);
                                    }}
                                    disabled={!formData.classId}
                                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100"
                                >
                                    <option value="">All Sections</option>
                                    {sections.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </FormSection>

                        {/* Preview Section */}
                        {formData.feeStructureId && formData.classId && (
                            <FormSection title="Preview">
                                <div className="col-span-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handlePreview}
                                        isLoading={previewMutation.isLoading}
                                    >
                                        Preview Affected Students
                                    </Button>

                                    {previewCount !== null && (
                                        <div className="mt-4 rounded-lg border border-gray-200 p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-5 w-5 text-primary-500" />
                                                    <span className="text-lg font-medium">{previewCount} students</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-5 w-5 text-green-500" />
                                                    <span className="text-lg font-medium">
                                                        {formatCurrency((selectedStructure?.amount ?? 0) * previewCount)}
                                                    </span>
                                                    <span className="text-sm text-gray-500">total</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </FormSection>
                        )}

                        <FormActions>
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                isLoading={assignMutation.isLoading}
                                disabled={previewCount === null || previewCount === 0}
                            >
                                <DollarSign className="mr-2 h-4 w-4" />
                                Assign to {previewCount ?? 0} Students
                            </Button>
                        </FormActions>
                    </Form>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
