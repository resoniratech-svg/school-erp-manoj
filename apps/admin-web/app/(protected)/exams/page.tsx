'use client';

/**
 * Exams Module Landing Page
 */

import Link from 'next/link';
import { FileText, Calendar, Award } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { WithFeature } from '@/components/auth/WithFeature';
import { WithPermission } from '@/components/auth/WithPermission';

const modules = [
    {
        title: 'Exams',
        description: 'Create and manage examinations',
        href: '/exams/exams',
        icon: FileText,
        permission: 'exam:read:branch',
    },
    {
        title: 'Schedules',
        description: 'Configure exam date and subject schedules',
        href: '/exams/schedules',
        icon: Calendar,
        permission: 'exam:read:branch',
    },
    {
        title: 'Marks Entry',
        description: 'Enter and view student marks',
        href: '/exams/marks',
        icon: Award,
        permission: 'marks:read:branch',
    },
];

export default function ExamsLandingPage() {
    return (
        <WithFeature flag="exams.enabled">
            <PageContent>
                <PageHeader
                    title="Exams & Assessments"
                    subtitle="Manage examinations, schedules, and marks"
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
