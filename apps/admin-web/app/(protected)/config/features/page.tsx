'use client';

import { useState } from 'react';
import { ToggleRight, AlertTriangle, Info } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { useQuery, useMutation } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { configClient, type FeatureFlag } from '@school-erp/api-client';

const SCOPE_VARIANTS: Record<string, 'default' | 'warning' | 'info'> = { default: 'default', tenant: 'info', branch: 'warning' };

export default function FeaturesPage() {
    const toast = useToast();
    const confirm = useConfirm();

    const { data, isLoading, isError, refetch } = useQuery(() => configClient.features.list());

    const updateMutation = useMutation(
        ({ key, enabled }: { key: string; enabled: boolean }) => configClient.features.update(key, { enabled }),
        {
            onSuccess: () => { toast.success('Feature flag updated'); refetch(); },
            onError: (e) => toast.error(e.message || 'Failed to update'),
        }
    );

    const handleToggle = async (flag: FeatureFlag) => {
        const newValue = !flag.enabled;
        const confirmed = await confirm({
            title: `${newValue ? 'Enable' : 'Disable'} Feature`,
            message: `${newValue ? 'Enable' : 'Disable'} "${flag.name}"?${flag.scope === 'default' ? ' This will override default setting.' : ''}`,
            confirmLabel: newValue ? 'Enable' : 'Disable',
            variant: newValue ? 'default' : 'danger',
        });
        if (confirmed) updateMutation.mutate({ key: flag.key, enabled: newValue });
    };

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    const features = data?.data ?? [];

    return (
        <WithPermission permission="config:read:tenant">
            <PageContent>
                <PageHeader title="Feature Flags" subtitle="Enable or disable system features" />
                <Card className="border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-600" /><p className="text-sm text-amber-700">Toggling features affects all users. Changes require confirmation.</p></div>
                </Card>
                <Card>
                    <div className="divide-y divide-gray-200">
                        {features.map((flag) => (
                            <div key={flag.key} className="flex items-center justify-between py-4">
                                <div className="flex items-start gap-3">
                                    <ToggleRight className={`h-5 w-5 ${flag.enabled ? 'text-green-500' : 'text-gray-400'}`} />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{flag.name}</p>
                                            <Badge variant={SCOPE_VARIANTS[flag.scope] ?? 'default'}>{flag.scope}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-500">{flag.key}</p>
                                        {flag.description && <p className="mt-1 text-sm text-gray-400">{flag.description}</p>}
                                    </div>
                                </div>
                                <WithPermission permission="config:update:tenant">
                                    <Button variant={flag.enabled ? 'outline' : 'primary'} size="sm" onClick={() => handleToggle(flag)} isLoading={updateMutation.isLoading}>
                                        {flag.enabled ? 'Disable' : 'Enable'}
                                    </Button>
                                </WithPermission>
                            </div>
                        ))}
                        {features.length === 0 && <p className="py-4 text-gray-500">No feature flags configured</p>}
                    </div>
                </Card>
            </PageContent>
        </WithPermission>
    );
}
