'use client';

import Link from 'next/link';
import { Megaphone, Bell } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { WithFeature } from '@/components/auth/WithFeature';
import { WithPermission } from '@/components/auth/WithPermission';

const modules = [
    { title: 'Announcements', description: 'Create and publish announcements', href: '/communication/announcements', icon: Megaphone, permission: 'announcement:read:branch' },
    { title: 'Notifications', description: 'View notification delivery status', href: '/communication/notifications', icon: Bell, permission: 'notification:read:branch' },
];

export default function CommunicationPage() {
    return (
        <WithFeature flag="communication.enabled">
            <PageContent>
                <PageHeader title="Communication" subtitle="Announcements and notifications" />
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
        </WithFeature>
    );
}
