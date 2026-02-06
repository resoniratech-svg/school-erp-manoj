'use client';

/**
 * Create Fee Structure Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Form, FormSection, FormActions } from '@/components/ui/Form';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { WithFeature } from '@/components/auth/WithFeature';
import { useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
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

export default function CreateFeeStructurePage() {
    const router = useRouter();
    const toast = useToast();

    const [formData, setFormData] = useState({
        name: '',
        type: 'tuition',
        amount: '',
        description: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useMutation(
        () =>
            feesClient.structures.create({
                name: formData.name,
                type: formData.type,
                amount: parseFloat(formData.amount),
                description: formData.description || undefined,
            }),
        {
            onSuccess: (structure) => {
                toast.success('Fee structure created successfully');
                router.push(`/fees/structures/${structure.id}`);
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to create fee structure');
                }
            },
        }
    );

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        if (!formData.amount) {
            newErrors.amount = 'Amount is required';
        } else if (parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            createMutation.mutate(undefined);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    return (
        <WithFeature flag="fees.enabled">
            <PageContent>
                <PageHeader
                    title="Create Fee Structure"
                    subtitle="Define a new fee type and amount"
                    actions={
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    }
                />

                <Card>
                    <Form
                        onSubmit={handleSubmit}
                        isSubmitting={createMutation.isLoading}
                        error={createMutation.error?.message}
                    >
                        <FormSection title="Fee Details">
                            <FormField
                                name="name"
                                label="Fee Name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                error={errors.name}
                                required
                                placeholder="e.g., Annual Tuition Fee"
                            />
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Fee Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleChange('type', e.target.value)}
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
                                onChange={(e) => handleChange('amount', e.target.value)}
                                error={errors.amount}
                                required
                                placeholder="e.g., 50000"
                                min={0}
                                step={0.01}
                            />
                            <FormField
                                name="description"
                                label="Description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Optional description for this fee"
                            />
                        </FormSection>

                        <FormActions>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={createMutation.isLoading}>
                                Create Structure
                            </Button>
                        </FormActions>
                    </Form>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
