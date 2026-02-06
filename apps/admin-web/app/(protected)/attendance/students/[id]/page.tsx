'use client';

/**
 * Attendance Record Detail Page
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, User, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Form, FormSection, FormActions } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery, useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { attendanceClient, isApiError } from '@school-erp/api-client';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'excused';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'half_day', label: 'Half Day' },
    { value: 'excused', label: 'Excused' },
];

const STATUS_VARIANTS: Record<string, 'success' | 'error' | 'warning' | 'default' | 'info'> = {
    present: 'success',
    absent: 'error',
    late: 'warning',
    half_day: 'info',
    excused: 'default',
};

interface PageProps {
    params: { id: string };
}

export default function AttendanceDetailPage({ params }: PageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const isEditMode = searchParams.get('edit') === 'true';

    const [isEditing, setIsEditing] = useState(isEditMode);
    const [status, setStatus] = useState<AttendanceStatus>('present');

    const { data: record, isLoading, isError, refetch } = useQuery(
        () => attendanceClient.get(params.id)
    );

    useEffect(() => {
        if (record) {
            setStatus(record.status as AttendanceStatus);
        }
    }, [record]);

    const updateMutation = useMutation(
        () => attendanceClient.update(params.id, { status }),
        {
            onSuccess: () => {
                toast.success('Attendance updated');
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(undefined);
    };

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError || !record) {
        return <PageError onRetry={refetch} />;
    }

    return (
        <WithFeature flag="attendance.enabled">
            <PageContent>
                <PageHeader
                    title="Attendance Record"
                    subtitle={`Record #${record.id.slice(0, 8)}`}
                    actions={
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            {!isEditing && (
                                <WithPermission permission="attendance:update:branch">
                                    <Button onClick={() => setIsEditing(true)}>Edit</Button>
                                </WithPermission>
                            )}
                        </div>
                    }
                />

                {/* Info Card */}
                <Card>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <User className="h-6 w-6 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Student</p>
                                <p className="font-medium">{record.student?.name ?? '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-6 w-6 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Date</p>
                                <p className="font-medium">
                                    {new Date(record.date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <Badge variant={STATUS_VARIANTS[record.status] ?? 'default'}>
                            {record.status?.replace('_', ' ')}
                        </Badge>
                    </div>
                </Card>

                {/* Details */}
                <Card title="Details">
                    {isEditing ? (
                        <Form onSubmit={handleSubmit} isSubmitting={updateMutation.isLoading}>
                            <FormSection>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                                        className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
                                    >
                                        {STATUS_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
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
                                    Save
                                </Button>
                            </FormActions>
                        </Form>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm text-gray-500">Class</p>
                                <p className="font-medium">{record.class?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Section</p>
                                <p className="font-medium">{record.section?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Marked At</p>
                                <p className="font-medium">
                                    {new Date(record.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}
                </Card>
            </PageContent>
        </WithFeature>
    );
}
