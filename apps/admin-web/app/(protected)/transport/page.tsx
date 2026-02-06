'use client';

/**
 * Transport Module Landing Page
 */

import Link from 'next/link';
import { Bus, Route, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { WithFeature } from '@/components/auth/WithFeature';
import { WithPermission } from '@/components/auth/WithPermission';

const modules = [
    {
        title: 'Routes',
        description: 'Manage bus routes and stops',
        href: '/transport/routes',
        icon: Route,
        permission: 'transport_route:read:branch',
    },
    {
        title: 'Vehicles',
        description: 'Track buses and capacity',
        href: '/transport/vehicles',
        icon: Bus,
        permission: 'vehicle:read:branch',
    },
    {
        title: 'Assignments',
        description: 'Assign students to routes',
        href: '/transport/assignments',
        icon: Users,
        permission: 'transport_assign:read:branch',
    },
];

export default function TransportPage() {
    return (
        <WithFeature flag="transport.enabled">
            <PageContent>
                <PageHeader
                    title="Transport Management"
                    subtitle="Manage routes, vehicles, and student assignments"
                />

                <div className="grid gap-6 md:grid-cols-3">
                    {modules.map((module) => (
                        <WithPermission key={module.href} permission={module.permission}>
                            <Link href={module.href}>
                                <Card className="transition-shadow hover:shadow-md">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-lg bg-primary-100 p-3">
                                            <module.icon className="h-6 w-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{module.title}</h3>
                                            <p className="mt-1 text-sm text-gray-500">{module.description}</p>
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
