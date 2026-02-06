'use client';

/**
 * Mark Staff Attendance Page
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertTriangle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/PageLoader';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery, useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { attendanceClient, isApiError } from '@school-erp/api-client';

type StaffStatus = 'present' | 'absent' | 'late' | 'leave';

interface StaffAttendance {
    staffId: string;
    staffName: string;
    department: string;
    status: StaffStatus;
    checkInTime: string;
}

const STATUS_OPTIONS: { value: StaffStatus; label: string }[] = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'leave', label: 'Leave' },
];

export default function MarkStaffAttendancePage() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();

    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [attendance, setAttendance] = useState<StaffAttendance[]>([]);

    const isFutureDate = date > today;

    const { data: staffData, isLoading } = useQuery(
        () => attendanceClient.staff.getForMarking({ date }),
        { enabled: !isFutureDate }
    );

    useEffect(() => {
        if (staffData?.staff) {
            setAttendance(
                staffData.staff.map((s: { id: string; name: string; department: string; existingStatus?: StaffStatus; existingCheckIn?: string }) => ({
                    staffId: s.id,
                    staffName: s.name,
                    department: s.department,
                    status: s.existingStatus ?? 'present',
                    checkInTime: s.existingCheckIn ?? '',
                }))
            );
        }
    }, [staffData]);

    const saveMutation = useMutation(
        () =>
            attendanceClient.staff.markBulk({
                date,
                records: attendance.map((a) => ({
                    staffId: a.staffId,
                    status: a.status,
                    checkInTime: a.checkInTime || undefined,
                })),
            }),
        {
            onSuccess: () => {
                toast.success('Staff attendance saved');
                router.push('/attendance/staff');
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

    const handleChange = (staffId: string, field: 'status' | 'checkInTime', value: string) => {
        setAttendance((prev) =>
            prev.map((a) => (a.staffId === staffId ? { ...a, [field]: value } : a))
        );
    };

    const handleSubmit = async () => {
        const confirmed = await confirm({
            title: 'Save Staff Attendance',
            message: `Save attendance for ${attendance.length} staff members?`,
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
                    title="Mark Staff Attendance"
                    subtitle="Record daily staff attendance"
                    actions={
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    }
                />

                {/* Date Selection */}
                <Card>
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                max={today}
                                onChange={(e) => setDate(e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                            />
                        </div>
                        {isFutureDate && (
                            <div className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm">Cannot mark future dates</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Attendance Grid */}
                {!isFutureDate && (
                    <>
                        {isLoading ? (
                            <PageLoader />
                        ) : attendance.length > 0 ? (
                            <Card>
                                <div className="divide-y divide-gray-200">
                                    {attendance.map((staff) => (
                                        <div
                                            key={staff.staffId}
                                            className="grid gap-4 py-4 md:grid-cols-4"
                                        >
                                            <div>
                                                <p className="font-medium">{staff.staffName}</p>
                                                <p className="text-sm text-gray-500">{staff.department}</p>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs text-gray-500">
                                                    Status
                                                </label>
                                                <select
                                                    value={staff.status}
                                                    onChange={(e) =>
                                                        handleChange(staff.staffId, 'status', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg border px-3 py-2 text-sm ${staff.status === 'present'
                                                            ? 'border-green-300 bg-green-50'
                                                            : staff.status === 'absent'
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
                                            <div>
                                                <label className="mb-1 block text-xs text-gray-500">
                                                    Check In
                                                </label>
                                                <input
                                                    type="time"
                                                    value={staff.checkInTime}
                                                    onChange={(e) =>
                                                        handleChange(staff.staffId, 'checkInTime', e.target.value)
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <Button onClick={handleSubmit} isLoading={saveMutation.isLoading}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Attendance
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <Card>
                                <p className="text-gray-500">No staff members found</p>
                            </Card>
                        )}
                    </>
                )}
            </PageContent>
        </WithFeature>
    );
}
