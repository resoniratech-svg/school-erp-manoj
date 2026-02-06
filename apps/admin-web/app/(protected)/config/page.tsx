'use client';

import Link from 'next/link';
import { ToggleRight, Hash, Shield, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { WithPermission } from '@/components/auth/WithPermission';

const modules = [
    { title: 'Feature Flags', description: 'Enable/disable system features', href: '/config/features', icon: ToggleRight, permission: 'config:read:tenant' },
    { title: 'System Limits', description: 'Configure numeric limits', href: '/config/limits', icon: Hash, permission: 'config:read:tenant' },
    { title: 'Policies', description: 'Boolean policy settings', href: '/config/policies', icon: Shield, permission: 'config:read:tenant' },
];

export default function ConfigPage() {
    return (
        <WithPermission permission="config:read:tenant">
            <PageContent>
                <PageHeader title="System Configuration" subtitle="Manage system settings and feature flags" />
                <Card className="border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-600" /><p className="text-sm text-amber-700">Configuration changes affect entire tenant. Changes require confirmation.</p></div>
                </Card>
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
        </WithPermission>
    );
}
