'use client';

/**
 * Student Attendance List Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ClipboardCheck, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { DataTable, type Column, type RowAction } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { WithFeature } from '@/components/auth/WithFeature';
import { useQuery } from '@/lib/hooks';
import { attendanceClient, type AttendanceRecord } from '@school-erp/api-client';

const STATUS_VARIANTS: Record<string, 'success' | 'error' | 'warning' | 'default' | 'info'> = {
    present: 'success',
    absent: 'error',
    late: 'warning',
    half_day: 'info',
    excused: 'default',
};

export default function StudentAttendancePage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { data, isLoading, isError, refetch } = useQuery(
        () => attendanceClient.list({ page, limit: 25, date })
    );

    const columns: Column<AttendanceRecord>[] = [
        {
            key: 'student',
            header: 'Student',
            accessor: (row) => row.student?.name ?? '—',
        },
        {
            key: 'class',
            header: 'Class',
            accessor: (row) => `${row.class?.name ?? ''} - ${row.section?.name ?? ''}`,
        },
        {
            key: 'date',
            header: 'Date',
            accessor: (row) => new Date(row.date).toLocaleDateString(),
        },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            render: (value) => (
                <Badge variant={STATUS_VARIANTS[String(value)] ?? 'default'}>
                    {String(value).replace('_', ' ')}
                </Badge>
            ),
        },
    ];

    const actions: RowAction<AttendanceRecord>[] = [
        {
            label: 'View',
            icon: <Eye className="h-3 w-3" />,
            onClick: (row) => router.push(`/attendance/students/${row.id}`),
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
                    title="Student Attendance"
                    subtitle="View and manage student attendance records"
                    actions={
                        <WithPermission permission="attendance:create:branch">
                            <Button onClick={() => router.push('/attendance/students/mark')}>
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
                        actions={actions}
                        emptyState={{
                            title: 'No attendance records',
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
