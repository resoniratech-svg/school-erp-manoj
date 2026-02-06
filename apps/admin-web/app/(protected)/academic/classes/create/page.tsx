'use client';

/**
 * Create Class Page
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

export default function CreateClassPage() {
    const router = useRouter();
    const toast = useToast();

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        grade: '',
        academicYearId: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: yearsData } = useQuery(() => academicClient.years.list({ limit: 100 }));
    const academicYears = yearsData?.data ?? [];

    const createMutation = useMutation(
        () =>
            academicClient.classes.create({
                name: formData.name,
                code: formData.code,
                grade: parseInt(formData.grade, 10),
                academicYearId: formData.academicYearId,
            }),
        {
            onSuccess: (classItem) => {
                toast.success('Class created successfully');
                router.push(`/academic/classes/${classItem.id}`);
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to create class');
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
        if (!formData.grade) {
            newErrors.grade = 'Grade is required';
        }
        if (!formData.academicYearId) {
            newErrors.academicYearId = 'Academic year is required';
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
                    title="Create Class"
                    subtitle="Add a new class to the academic structure"
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
                        <FormSection title="Class Details">
                            <FormField
                                name="name"
                                label="Class Name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                error={errors.name}
                                required
                                placeholder="e.g., Class 10"
                            />
                            <FormField
                                name="code"
                                label="Class Code"
                                value={formData.code}
                                onChange={(e) => handleChange('code', e.target.value)}
                                error={errors.code}
                                required
                                placeholder="e.g., CLS10"
                            />
                            <FormField
                                name="grade"
                                label="Grade Level"
                                type="number"
                                value={formData.grade}
                                onChange={(e) => handleChange('grade', e.target.value)}
                                error={errors.grade}
                                required
                                placeholder="e.g., 10"
                            />
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Academic Year <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.academicYearId}
                                    onChange={(e) => handleChange('academicYearId', e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                >
                                    <option value="">Select academic year</option>
                                    {academicYears.map((year) => (
                                        <option key={year.id} value={year.id}>
                                            {year.name} {year.isCurrent && '(Current)'}
                                        </option>
                                    ))}
                                </select>
                                {errors.academicYearId && (
                                    <p className="mt-1 text-sm text-red-500">{errors.academicYearId}</p>
                                )}
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
                                Create Class
                            </Button>
                        </FormActions>
                    </Form>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
