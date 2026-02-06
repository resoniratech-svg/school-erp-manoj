'use client';

/**
 * Marks Entry/View by Exam Page
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Lock, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery, useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { examsClient, academicClient, isApiError } from '@school-erp/api-client';

interface MarkEntry {
    studentId: string;
    studentName: string;
    rollNumber: string;
    marks: string;
    grade: string;
}

interface PageProps {
    params: { examId: string };
}

export default function ExamMarksPage({ params }: PageProps) {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();

    const [scheduleId, setScheduleId] = useState('');
    const [marks, setMarks] = useState<MarkEntry[]>([]);

    const { data: exam, isLoading: examLoading } = useQuery(
        () => examsClient.get(params.examId)
    );

    const { data: schedulesData } = useQuery(
        () => examsClient.schedules.list({ examId: params.examId, limit: 100 })
    );
    const schedules = schedulesData?.data ?? [];

    const { data: marksData, isLoading: marksLoading, refetch } = useQuery(
        () => examsClient.marks.get({ scheduleId }),
        { enabled: !!scheduleId }
    );

    useEffect(() => {
        if (marksData?.entries) {
            setMarks(
                marksData.entries.map((e: { studentId: string; studentName: string; rollNumber: string; marks?: number; grade?: string }) => ({
                    studentId: e.studentId,
                    studentName: e.studentName,
                    rollNumber: e.rollNumber,
                    marks: e.marks !== undefined ? String(e.marks) : '',
                    grade: e.grade ?? '',
                }))
            );
        }
    }, [marksData]);

    const isPublished = exam?.status === 'published';
    const selectedSchedule = schedules.find((s) => s.id === scheduleId);
    const maxMarks = selectedSchedule?.maxMarks ?? 100;

    const saveMutation = useMutation(
        () =>
            examsClient.marks.saveBulk({
                scheduleId,
                entries: marks.map((m) => ({
                    studentId: m.studentId,
                    marks: m.marks ? parseFloat(m.marks) : undefined,
                })),
            }),
        {
            onSuccess: () => {
                toast.success('Marks saved');
                refetch();
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to save');
                }
            },
        }
    );

    const handleMarksChange = (studentId: string, value: string) => {
        setMarks((prev) =>
            prev.map((m) => (m.studentId === studentId ? { ...m, marks: value } : m))
        );
    };

    const handleSave = async () => {
        const confirmed = await confirm({
            title: 'Save Marks',
            message: `Save marks for ${marks.length} students?`,
            confirmLabel: 'Save',
            variant: 'default',
        });

        if (confirmed) {
            saveMutation.mutate(undefined);
        }
    };

    if (examLoading) {
        return <PageLoader />;
    }

    if (!exam) {
        return <PageError />;
    }

    return (
        <WithFeature flag="exams.enabled">
            <PageContent>
                <PageHeader
                    title={`Marks: ${exam.name}`}
                    subtitle="Enter and view marks by subject"
                    actions={
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    }
                />

                {/* Exam Status */}
                {isPublished && (
                    <Card className="border-blue-200 bg-blue-50">
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="font-medium text-blue-800">Published Exam</p>
                                <p className="text-sm text-blue-700">
                                    Marks cannot be edited after exam is published
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Schedule Selection */}
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Select Subject / Schedule
                            </label>
                            <select
                                value={scheduleId}
                                onChange={(e) => setScheduleId(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
                            >
                                <option value="">Select schedule</option>
                                {schedules.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.subject?.name} - {s.class?.name} {s.section?.name ? `(${s.section.name})` : ''} - {new Date(s.date).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedSchedule && (
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Max Marks</p>
                                <p className="text-xl font-bold">{maxMarks}</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Marks Entry */}
                {scheduleId && (
                    <>
                        {marksLoading ? (
                            <PageLoader />
                        ) : marks.length > 0 ? (
                            <Card>
                                <div className="divide-y divide-gray-200">
                                    {marks.map((student) => (
                                        <div
                                            key={student.studentId}
                                            className="flex items-center justify-between py-3"
                                        >
                                            <div>
                                                <p className="font-medium">{student.studentName}</p>
                                                <p className="text-sm text-gray-500">Roll: {student.rollNumber}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="number"
                                                    value={student.marks}
                                                    onChange={(e) =>
                                                        handleMarksChange(student.studentId, e.target.value)
                                                    }
                                                    disabled={isPublished}
                                                    min={0}
                                                    max={maxMarks}
                                                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center focus:border-primary-500 focus:outline-none disabled:bg-gray-100"
                                                    placeholder="—"
                                                />
                                                <span className="text-gray-400">/ {maxMarks}</span>
                                                {student.grade && (
                                                    <Badge variant="info">{student.grade}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {!isPublished && (
                                    <div className="mt-6 flex justify-end">
                                        <WithPermission permission="marks:update:branch">
                                            <Button onClick={handleSave} isLoading={saveMutation.isLoading}>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Marks
                                            </Button>
                                        </WithPermission>
                                    </div>
                                )}
                            </Card>
                        ) : (
                            <Card>
                                <div className="flex items-center gap-2 text-gray-500">
                                    <AlertCircle className="h-5 w-5" />
                                    <span>No students found for this schedule</span>
                                </div>
                            </Card>
                        )}
                    </>
                )}
            </PageContent>
        </WithFeature>
    );
}
