'use client';

/**
 * Create Academic Year Page
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

export default function CreateAcademicYearPage() {
    const router = useRouter();
    const toast = useToast();

    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useMutation(
        () =>
            academicClient.years.create({
                name: formData.name,
                startDate: formData.startDate,
                endDate: formData.endDate,
            }),
        {
            onSuccess: (year) => {
                toast.success('Academic year created successfully');
                router.push(`/academic/years/${year.id}`);
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to create academic year');
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
            if (new Date(formData.endDate) <= new Date(formData.startDate)) {
                newErrors.endDate = 'End date must be after start date';
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
        <WithFeature flag="academic.enabled">
            <PageContent>
                <PageHeader
                    title="Create Academic Year"
                    subtitle="Add a new academic year cycle"
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
                        <FormSection title="Year Details">
                            <FormField
                                name="name"
                                label="Year Name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                error={errors.name}
                                required
                                placeholder="e.g., 2024-2025"
                            />
                            <div /> {/* Empty cell for grid alignment */}
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
                                Create Year
                            </Button>
                        </FormActions>
                    </Form>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
