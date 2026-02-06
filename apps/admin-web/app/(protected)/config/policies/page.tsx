'use client';

import { Shield, AlertTriangle } from 'lucide-react';
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
import { configClient, type ConfigPolicy } from '@school-erp/api-client';

const SCOPE_VARIANTS: Record<string, 'default' | 'warning' | 'info'> = { default: 'default', tenant: 'info', branch: 'warning' };

export default function PoliciesPage() {
    const toast = useToast();
    const confirm = useConfirm();

    const { data, isLoading, isError, refetch } = useQuery(() => configClient.policies.list());

    const updateMutation = useMutation(
        ({ key, enabled }: { key: string; enabled: boolean }) => configClient.policies.update(key, { enabled }),
        {
            onSuccess: () => { toast.success('Policy updated'); refetch(); },
            onError: (e) => toast.error(e.message || 'Failed to update'),
        }
    );

    const handleToggle = async (policy: ConfigPolicy) => {
        const newValue = !policy.enabled;
        const confirmed = await confirm({
            title: `${newValue ? 'Enable' : 'Disable'} Policy`,
            message: `${newValue ? 'Enable' : 'Disable'} "${policy.name}"?${policy.scope === 'default' ? ' This will override default setting.' : ''}`,
            confirmLabel: newValue ? 'Enable' : 'Disable',
            variant: newValue ? 'default' : 'danger',
        });
        if (confirmed) updateMutation.mutate({ key: policy.key, enabled: newValue });
    };

    if (isLoading) return <PageLoader />;
    if (isError) return <PageError onRetry={refetch} />;

    const policies = data?.data ?? [];

    return (
        <WithPermission permission="config:read:tenant">
            <PageContent>
                <PageHeader title="Policies" subtitle="Boolean policy settings" />
                <Card className="border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-600" /><p className="text-sm text-amber-700">Policy changes affect security and behavior. All updates require confirmation.</p></div>
                </Card>
                <Card>
                    <div className="divide-y divide-gray-200">
                        {policies.map((policy) => (
                            <div key={policy.key} className="flex items-center justify-between py-4">
                                <div className="flex items-start gap-3">
                                    <Shield className={`h-5 w-5 ${policy.enabled ? 'text-green-500' : 'text-gray-400'}`} />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{policy.name}</p>
                                            <Badge variant={SCOPE_VARIANTS[policy.scope] ?? 'default'}>{policy.scope}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-500">{policy.key}</p>
                                        {policy.description && <p className="mt-1 text-sm text-gray-400">{policy.description}</p>}
                                    </div>
                                </div>
                                <WithPermission permission="config:update:tenant">
                                    <Button variant={policy.enabled ? 'outline' : 'primary'} size="sm" onClick={() => handleToggle(policy)} isLoading={updateMutation.isLoading}>
                                        {policy.enabled ? 'Disable' : 'Enable'}
                                    </Button>
                                </WithPermission>
                            </div>
                        ))}
                        {policies.length === 0 && <p className="py-4 text-gray-500">No policies configured</p>}
                    </div>
                </Card>
            </PageContent>
        </WithPermission>
    );
}
