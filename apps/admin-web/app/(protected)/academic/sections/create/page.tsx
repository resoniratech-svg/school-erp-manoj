'use client';

/**
 * Create Section Page
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
import { useMutation, useQuery } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { academicClient, isApiError } from '@school-erp/api-client';

export default function CreateSectionPage() {
    const router = useRouter();
    const toast = useToast();

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        classId: '',
        capacity: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: classesData } = useQuery(() => academicClient.classes.list({ limit: 100 }));
    const classes = classesData?.data ?? [];

    const createMutation = useMutation(
        () =>
            academicClient.sections.create({
                name: formData.name,
                code: formData.code,
                classId: formData.classId,
                capacity: formData.capacity ? parseInt(formData.capacity, 10) : 0,
            }),
        {
            onSuccess: (section) => {
                toast.success('Section created successfully');
                router.push(`/academic/sections/${section.id}`);
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to create section');
                }
            },
        }
    );

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        if (!formData.classId) {
            newErrors.classId = 'Class is required';
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
                    title="Create Section"
                    subtitle="Add a new section to a class"
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
                        <FormSection title="Section Details">
                            <FormField
                                name="name"
                                label="Section Name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                error={errors.name}
                                required
                                placeholder="e.g., Section A"
                            />
                            <FormField
                                name="code"
                                label="Section Code"
                                value={formData.code}
                                onChange={(e) => handleChange('code', e.target.value)}
                                placeholder="e.g., 10A"
                            />
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Class <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.classId}
                                    onChange={(e) => handleChange('classId', e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                >
                                    <option value="">Select class</option>
                                    {classes.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.classId && (
                                    <p className="mt-1 text-sm text-red-500">{errors.classId}</p>
                                )}
                            </div>
                            <FormField
                                name="capacity"
                                label="Capacity"
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => handleChange('capacity', e.target.value)}
                                placeholder="e.g., 40"
                                helpText="Maximum number of students"
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
                                Create Section
                            </Button>
                        </FormActions>
                    </Form>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
