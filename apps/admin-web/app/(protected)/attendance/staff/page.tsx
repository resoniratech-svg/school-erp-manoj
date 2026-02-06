'use client';

/**
 * Staff Attendance List Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, Calendar, UserCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { attendanceClient, type StaffAttendanceRecord } from '@school-erp/api-client';

const STATUS_VARIANTS: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
    present: 'success',
    absent: 'error',
    late: 'warning',
    leave: 'default',
};

export default function StaffAttendancePage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { data, isLoading, isError, refetch } = useQuery(
        () => attendanceClient.staff.list({ page, limit: 25, date })
    );

    const columns: Column<StaffAttendanceRecord>[] = [
        {
            key: 'staff',
            header: 'Staff Member',
            accessor: (row) => row.staff?.name ?? '—',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{String(value)}</span>
                </div>
            ),
        },
        {
            key: 'department',
            header: 'Department',
            accessor: (row) => row.staff?.department ?? '—',
        },
        {
            key: 'date',
            header: 'Date',
            accessor: (row) => new Date(row.date).toLocaleDateString(),
        },
        {
            key: 'checkIn',
            header: 'Check In',
            accessor: (row) => row.checkInTime ?? '—',
        },
        {
            key: 'checkOut',
            header: 'Check Out',
            accessor: (row) => row.checkOutTime ?? '—',
        },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            render: (value) => (
                <Badge variant={STATUS_VARIANTS[String(value)] ?? 'default'}>
                    {String(value)}
                </Badge>
            ),
        },
    ];

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        return <PageError onRetry={refetch} />;
    }

    const records = data?.data ?? [];
    const pagination = data?.pagination;

    return (
        <WithFeature flag="attendance.enabled">
            <PageContent>
                <PageHeader
                    title="Staff Attendance"
                    subtitle="View and manage staff attendance records"
                    actions={
                        <WithPermission permission="staff_attendance:create:branch">
                            <Button onClick={() => router.push('/attendance/staff/mark')}>
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Mark Attendance
                            </Button>
                        </WithPermission>
                    }
                />

                {/* Date Filter */}
                <Card>
                    <div className="flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => {
                                    setDate(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </Card>

                <Card>
                    <DataTable
                        columns={columns}
                        data={records}
                        keyAccessor="id"
                        emptyState={{
                            title: 'No staff attendance records',
                            description: 'Mark attendance to see records here',
                        }}
                        pagination={
                            pagination
                                ? {
                                    currentPage: pagination.page,
                                    totalPages: pagination.totalPages,
                                    onPageChange: setPage,
                                }
                                : undefined
                        }
                    />
                </Card>
            </PageContent>
        </WithFeature>
    );
}
