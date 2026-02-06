'use client';

/**
 * Attendance Module Landing Page
 */

import Link from 'next/link';
import { Users, UserCheck, ClipboardCheck, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { WithFeature } from '@/components/auth/WithFeature';
import { WithPermission } from '@/components/auth/WithPermission';

const modules = [
    {
        title: 'Student Attendance',
        description: 'Mark and view daily student attendance by class',
        href: '/attendance/students',
        icon: Users,
        permission: 'attendance:read:branch',
    },
    {
        title: 'Mark Attendance',
        description: 'Bulk mark attendance for a class section',
        href: '/attendance/students/mark',
        icon: ClipboardCheck,
        permission: 'attendance:create:branch',
    },
    {
        title: 'Staff Attendance',
        description: 'View and manage staff attendance records',
        href: '/attendance/staff',
        icon: UserCheck,
        permission: 'staff_attendance:read:branch',
    },
];

export default function AttendancePage() {
    return (
        <WithFeature flag="attendance.enabled">
            <PageContent>
                <PageHeader
                    title="Attendance Management"
                    subtitle="Track and manage attendance for students and staff"
                />

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {modules.map((module) => (
                        <WithPermission key={module.href} permission={module.permission}>
                            <Link href={module.href}>
                                <Card className="transition-shadow hover:shadow-md">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-lg bg-primary-100 p-3">
                                            <module.icon className="h-6 w-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {module.title}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {module.description}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </WithPermission>
                    ))}
                </div>
            </PageContent>
        </WithFeature>
    );
}
