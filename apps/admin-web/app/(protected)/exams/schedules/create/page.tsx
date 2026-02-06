'use client';

/**
 * Create Exam Schedule Page
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
import { examsClient, academicClient, isApiError } from '@school-erp/api-client';

export default function CreateSchedulePage() {
    const router = useRouter();
    const toast = useToast();

    const [formData, setFormData] = useState({
        examId: '',
        subjectId: '',
        classId: '',
        sectionId: '',
        date: '',
        startTime: '',
        endTime: '',
        maxMarks: '100',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: examsData } = useQuery(() => examsClient.list({ limit: 100 }));
    const exams = examsData?.data ?? [];

    const { data: subjectsData } = useQuery(() => academicClient.subjects.list({ limit: 100 }));
    const subjects = subjectsData?.data ?? [];

    const { data: classesData } = useQuery(() => academicClient.classes.list({ limit: 100 }));
    const classes = classesData?.data ?? [];

    const { data: sectionsData } = useQuery(
        () => academicClient.sections.list({ classId: formData.classId, limit: 100 }),
        { enabled: !!formData.classId }
    );
    const sections = sectionsData?.data ?? [];

    const createMutation = useMutation(
        () =>
            examsClient.schedules.create({
                examId: formData.examId,
                subjectId: formData.subjectId,
                classId: formData.classId,
                sectionId: formData.sectionId || undefined,
                date: formData.date,
                startTime: formData.startTime,
                endTime: formData.endTime,
                maxMarks: parseInt(formData.maxMarks, 10),
            }),
        {
            onSuccess: () => {
                toast.success('Schedule created');
                router.push('/exams/schedules');
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to create schedule');
                }
            },
        }
    );

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.examId) newErrors.examId = 'Exam is required';
        if (!formData.subjectId) newErrors.subjectId = 'Subject is required';
        if (!formData.classId) newErrors.classId = 'Class is required';
        if (!formData.date) newErrors.date = 'Date is required';
        if (!formData.startTime) newErrors.startTime = 'Start time is required';
        if (!formData.endTime) newErrors.endTime = 'End time is required';

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
        if (field === 'classId') {
            setFormData((prev) => ({ ...prev, sectionId: '' }));
        }
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
                    title="Add Exam Schedule"
                    subtitle="Schedule an exam for a class"
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
                        <FormSection title="Schedule Details">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Exam <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.examId}
                                    onChange={(e) => handleChange('examId', e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
                                >
                                    <option value="">Select exam</option>
                                    {exams.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.examId && <p className="mt-1 text-sm text-red-500">{errors.examId}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.subjectId}
                                    onChange={(e) => handleChange('subjectId', e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
                                >
                                    <option value="">Select subject</option>
                                    {subjects.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.subjectId && <p className="mt-1 text-sm text-red-500">{errors.subjectId}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Class <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.classId}
                                    onChange={(e) => handleChange('classId', e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
                                >
                                    <option value="">Select class</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.classId && <p className="mt-1 text-sm text-red-500">{errors.classId}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Section
                                </label>
                                <select
                                    value={formData.sectionId}
                                    onChange={(e) => handleChange('sectionId', e.target.value)}
                                    disabled={!formData.classId}
                                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none disabled:bg-gray-100"
                                >
                                    <option value="">All Sections</option>
                                    {sections.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <FormField
                                name="date"
                                label="Date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                error={errors.date}
                                required
                            />

                            <FormField
                                name="maxMarks"
                                label="Max Marks"
                                type="number"
                                value={formData.maxMarks}
                                onChange={(e) => handleChange('maxMarks', e.target.value)}
                                min={0}
                            />

                            <FormField
                                name="startTime"
                                label="Start Time"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => handleChange('startTime', e.target.value)}
                                error={errors.startTime}
                                required
                            />

                            <FormField
                                name="endTime"
                                label="End Time"
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => handleChange('endTime', e.target.value)}
                                error={errors.endTime}
                                required
                            />
                        </FormSection>

                        <FormActions>
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={createMutation.isLoading}>
                                Create Schedule
                            </Button>
                        </FormActions>
                    </Form>
                </Card>
            </PageContent>
        </WithFeature>
    );
}
