'use client';

import Link from 'next/link';
import { ScrollText, Lock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { WithPermission } from '@/components/auth/WithPermission';

const modules = [
    { title: 'Audit Logs', description: 'View system audit trail', href: '/audit/logs', icon: ScrollText, permission: 'audit:read:branch' },
];

export default function AuditPage() {
    return (
        <PageContent>
            <PageHeader title="Audit Viewer" subtitle="System audit trail (read-only)" />
            <Card className="border-amber-200 bg-amber-50">
                <div className="flex items-center gap-3"><Lock className="h-5 w-5 text-amber-600" /><p className="text-sm text-amber-700">Audit logs are immutable and read-only. Sensitive fields are masked.</p></div>
            </Card>
            <div className="grid gap-6 md:grid-cols-2">
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
    );
}
