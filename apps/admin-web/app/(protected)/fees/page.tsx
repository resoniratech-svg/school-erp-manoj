'use client';

/**
 * Fees Module Landing Page
 */

import Link from 'next/link';
import { DollarSign, FileText, CreditCard, BarChart3, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { WithFeature } from '@/components/auth/WithFeature';
import { WithPermission } from '@/components/auth/WithPermission';

const modules = [
    {
        title: 'Fee Structures',
        description: 'Define fee types, amounts, and payment schedules',
        href: '/fees/structures',
        icon: FileText,
        permission: 'fee_structure:read:tenant',
    },
    {
        title: 'Fee Assignments',
        description: 'Assign fees to students by class or individually',
        href: '/fees/assignments',
        icon: DollarSign,
        permission: 'fee_assign:read:branch',
    },
    {
        title: 'Payments',
        description: 'View payment records (read-only audit trail)',
        href: '/fees/payments',
        icon: CreditCard,
        permission: 'fee_payment:read:branch',
    },
    {
        title: 'Reports',
        description: 'Collection summaries and defaulter reports',
        href: '/fees/reports/collection',
        icon: BarChart3,
        permission: 'fee_report:read:branch',
    },
];

export default function FeesPage() {
    return (
        <WithFeature flag="fees.enabled">
            <PageContent>
                <PageHeader
                    title="Fees & Payments"
                    subtitle="Manage fee structures, assignments, and payment records"
                />

                {/* Financial Safety Notice */}
                <Card className="border-amber-200 bg-amber-50">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <div>
                            <p className="font-medium text-amber-800">Financial Data Protection</p>
                            <p className="mt-1 text-sm text-amber-700">
                                Payment records are immutable and cannot be edited or deleted.
                                All actions are logged for audit compliance.
                            </p>
                        </div>
                    </div>
                </Card>

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
