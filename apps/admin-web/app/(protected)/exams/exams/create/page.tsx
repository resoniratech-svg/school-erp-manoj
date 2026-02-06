'use client';

/**
 * Create Exam Page
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
import { examsClient, isApiError } from '@school-erp/api-client';

const EXAM_TYPES = [
    { value: 'unit_test', label: 'Unit Test' },
    { value: 'mid_term', label: 'Mid Term' },
    { value: 'final', label: 'Final Exam' },
    { value: 'practical', label: 'Practical' },
    { value: 'assignment', label: 'Assignment' },
];

export default function CreateExamPage() {
    const router = useRouter();
    const toast = useToast();

    const [formData, setFormData] = useState({
        name: '',
        type: 'unit_test',
        startDate: '',
        endDate: '',
        description: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useMutation(
        () =>
            examsClient.create({
                name: formData.name,
                type: formData.type,
                startDate: formData.startDate,
                endDate: formData.endDate,
                description: formData.description || undefined,
            }),
        {
            onSuccess: (exam) => {
                toast.success('Exam created as draft');
                router.push(`/exams/exams/${exam.id}`);
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to create exam');
                }
            },
        }
    );

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        }
        if (!formData.endDate) {
            newErrors.endDate = 'End date is required';
        }
        if (formData.startDate && formData.endDate) {
            if (new Date(formData.endDate) < new Date(formData.startDate)) {
                newErrors.endDate = 'End date cannot be before start date';
            }
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
        <WithFeature flag="exams.enabled">
            <PageContent>
                <PageHeader
                    title="Create Exam"
                    subtitle="Create a new examination"
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
                        <FormSection title="Exam Details">
                            <FormField
                                name="name"
                                label="Exam Name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                error={errors.name}
                                required
                                placeholder="e.g., Mid Term Examination 2024"
                            />
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Exam Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleChange('type', e.target.value)}
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
                                onChange={(e) => handleChange('startDate', e.target.value)}
                                error={errors.startDate}
                                required
                            />
                            <FormField
                                name="endDate"
                                label="End Date"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                error={errors.endDate}
                                required
                            />
                            <FormField
                                name="description"
                                label="Description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Optional notes about the exam"
                            />
                        </FormSection>

                        <FormActions>
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={createMutation.isLoading}>
                                Create as Draft
                            </Button>
                        </FormActions>
                    </Form>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
