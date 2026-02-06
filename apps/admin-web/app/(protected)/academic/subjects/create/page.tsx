'use client';

/**
 * Create Subject Page
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
import { academicClient, isApiError } from '@school-erp/api-client';

const SUBJECT_TYPES = [
    { value: 'core', label: 'Core' },
    { value: 'elective', label: 'Elective' },
    { value: 'language', label: 'Language' },
    { value: 'activity', label: 'Activity' },
];

export default function CreateSubjectPage() {
    const router = useRouter();
    const toast = useToast();

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'core',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useMutation(
        () =>
            academicClient.subjects.create({
                name: formData.name,
                code: formData.code,
                type: formData.type as 'core' | 'elective' | 'language' | 'activity',
            }),
        {
            onSuccess: (subject) => {
                toast.success('Subject created successfully');
                router.push(`/academic/subjects/${subject.id}`);
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to create subject');
                }
            },
        }
    );

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        if (!formData.code.trim()) {
            newErrors.code = 'Code is required';
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
        <WithFeature flag="academic.enabled">
            <PageContent>
                <PageHeader
                    title="Create Subject"
                    subtitle="Add a new subject to the curriculum"
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
                        <FormSection title="Subject Details">
                            <FormField
                                name="name"
                                label="Subject Name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                error={errors.name}
                                required
                                placeholder="e.g., Mathematics"
                            />
                            <FormField
                                name="code"
                                label="Subject Code"
                                value={formData.code}
                                onChange={(e) => handleChange('code', e.target.value)}
                                error={errors.code}
                                required
                                placeholder="e.g., MATH"
                            />
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Subject Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleChange('type', e.target.value)}
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
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={createMutation.isLoading}>
                                Create Subject
                            </Button>
                        </FormActions>
                    </Form>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
