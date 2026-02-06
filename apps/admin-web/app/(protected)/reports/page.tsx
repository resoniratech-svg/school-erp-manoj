'use client';

import Link from 'next/link';
import { FileText, GraduationCap, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { WithFeature } from '@/components/auth/WithFeature';
import { WithPermission } from '@/components/auth/WithPermission';

const modules = [
    { title: 'Report Cards', description: 'View student report cards', href: '/reports/report-cards', icon: FileText, permission: 'report:read:branch' },
    { title: 'Transcripts', description: 'Academic history and transcripts', href: '/reports/transcripts', icon: GraduationCap, permission: 'transcript:read:tenant' },
    { title: 'Promotion Status', description: 'View promotion eligibility', href: '/reports/promotion', icon: TrendingUp, permission: 'report:read:branch' },
];

export default function ReportsPage() {
    return (
        <WithFeature flag="reports.enabled">
            <PageContent>
                <PageHeader title="Reports" subtitle="Academic reports and transcripts" />
                <div className="grid gap-6 md:grid-cols-3">
                    {modules.map((m) => (
                        <WithPermission key={m.href} permission={m.permission}>
                            <Link href={m.href}>
                                <Card className="transition-shadow hover:shadow-md">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-lg bg-primary-100 p-3"><m.icon className="h-6 w-6 text-primary-600" /></div>
                                        <div><h3 className="font-semibold text-gray-900">{m.title}</h3><p className="mt-1 text-sm text-gray-500">{m.description}</p></div>
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
