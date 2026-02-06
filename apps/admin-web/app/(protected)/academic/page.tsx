'use client';

/**
 * Academic Module Landing Page
 */

import Link from 'next/link';
import { Calendar, BookOpen, Users, GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { WithFeature } from '@/components/auth/WithFeature';
import { WithPermission } from '@/components/auth/WithPermission';

const modules = [
    {
        title: 'Academic Years',
        description: 'Manage academic year cycles and sessions',
        href: '/academic/years',
        icon: Calendar,
        permission: 'academic_year:read:tenant',
    },
    {
        title: 'Classes',
        description: 'Configure classes and grade levels',
        href: '/academic/classes',
        icon: GraduationCap,
        permission: 'class:read:branch',
    },
    {
        title: 'Sections',
        description: 'Organize class sections and assign teachers',
        href: '/academic/sections',
        icon: Users,
        permission: 'section:read:branch',
    },
    {
        title: 'Subjects',
        description: 'Define subjects and curriculum structure',
        href: '/academic/subjects',
        icon: BookOpen,
        permission: 'subject:read:tenant',
    },
];

export default function AcademicPage() {
    return (
        <WithFeature flag="academic.enabled">
            <PageContent>
                <PageHeader
                    title="Academic Management"
                    subtitle="Configure academic structure and curriculum"
                />

                <div className="grid gap-6 md:grid-cols-2">
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
