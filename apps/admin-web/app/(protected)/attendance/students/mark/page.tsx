'use client';

/**
 * Mark Student Attendance Page (Bulk)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery, useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { attendanceClient, academicClient, isApiError } from '@school-erp/api-client';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'excused';

interface StudentAttendance {
    studentId: string;
    studentName: string;
    rollNumber: string;
    status: AttendanceStatus;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'half_day', label: 'Half Day' },
    { value: 'excused', label: 'Excused' },
];

export default function MarkAttendancePage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();

    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [classId, setClassId] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [attendance, setAttendance] = useState<StudentAttendance[]>([]);

    const isFutureDate = date > today;

    const { data: classesData } = useQuery(() => academicClient.classes.list({ limit: 100 }));
    const classes = classesData?.data ?? [];

    const { data: sectionsData } = useQuery(
        () => academicClient.sections.list({ classId, limit: 100 }),
        { enabled: !!classId }
    );
    const sections = sectionsData?.data ?? [];

    const { data: studentsData, isLoading: studentsLoading } = useQuery(
        () => attendanceClient.getStudentsForMarking({ classId, sectionId, date }),
        { enabled: !!classId && !!sectionId && !isFutureDate }
    );

    useEffect(() => {
        if (studentsData?.students) {
            setAttendance(
                studentsData.students.map((s: { id: string; name: string; rollNumber: string; existingStatus?: AttendanceStatus }) => ({
                    studentId: s.id,
                    studentName: s.name,
                    rollNumber: s.rollNumber,
                    status: s.existingStatus ?? 'present',
                }))
            );
        }
    }, [studentsData]);

    const saveMutation = useMutation(
        () =>
            attendanceClient.markBulk({
                date,
                classId,
                sectionId,
                records: attendance.map((a) => ({
                    studentId: a.studentId,
                    status: a.status,
                })),
            }),
        {
            onSuccess: () => {
                toast.success('Attendance saved successfully');
                router.push('/attendance/students');
            },
            onError: (error) => {
                if (isApiError(error)) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to save attendance');
                }
            },
        }
    );

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance((prev) =>
            prev.map((a) => (a.studentId === studentId ? { ...a, status } : a))
        );
    };

    const handleMarkAllPresent = () => {
        setAttendance((prev) => prev.map((a) => ({ ...a, status: 'present' })));
    };

    const handleSubmit = async () => {
        const confirmed = await confirm({
            title: 'Save Attendance',
            message: `Save attendance for ${attendance.length} students on ${new Date(date).toLocaleDateString()}?`,
            confirmLabel: 'Save',
            variant: 'default',
        });

        if (confirmed) {
            saveMutation.mutate(undefined);
        }
    };

    return (
        <WithFeature flag="attendance.enabled">
            <PageContent>
                <PageHeader
                    title="Mark Attendance"
                    subtitle="Bulk mark attendance for a class section"
                    actions={
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    }
                />

                {/* Selection */}
                <Card>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                max={today}
                                onChange={(e) => setDate(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                            />
                            {isFutureDate && (
                                <p className="mt-1 text-sm text-red-500">
                                    Cannot mark attendance for future dates
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Class
                            </label>
                            <select
                                value={classId}
                                onChange={(e) => {
                                    setClassId(e.target.value);
                                    setSectionId('');
                                }}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
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
                                Section
                            </label>
                            <select
                                value={sectionId}
                                onChange={(e) => setSectionId(e.target.value)}
                                disabled={!classId}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none disabled:bg-gray-100"
                            >
                                <option value="">Select section</option>
                                {sections.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Attendance Grid */}
                {classId && sectionId && !isFutureDate && (
                    <>
                        {studentsLoading ? (
                            <PageLoader />
                        ) : attendance.length > 0 ? (
                            <Card>
                                <div className="mb-4 flex items-center justify-between">
                                    <p className="text-sm text-gray-500">
                                        {attendance.length} students
                                    </p>
                                    <Button variant="outline" size="sm" onClick={handleMarkAllPresent}>
                                        Mark All Present
                                    </Button>
                                </div>

                                <div className="divide-y divide-gray-200">
                                    {attendance.map((student) => (
                                        <div
                                            key={student.studentId}
                                            className="flex items-center justify-between py-3"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {student.studentName}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Roll: {student.rollNumber}
                                                </p>
                                            </div>
                                            <select
                                                value={student.status}
                                                onChange={(e) =>
                                                    handleStatusChange(
                                                        student.studentId,
                                                        e.target.value as AttendanceStatus
                                                    )
                                                }
                                                className={`rounded-lg border px-3 py-2 text-sm ${student.status === 'present'
                                                        ? 'border-green-300 bg-green-50'
                                                        : student.status === 'absent'
                                                            ? 'border-red-300 bg-red-50'
                                                            : 'border-gray-300'
                                                    }`}
                                            >
                                                {STATUS_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button
                                        onClick={handleSubmit}
                                        isLoading={saveMutation.isLoading}
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Attendance
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <Card>
                                <p className="text-gray-500">No students found in this section</p>
                            </Card>
                        )}
                    </>
                )}
            </PageContent>
        </WithFeature>
    );
}
